import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import WebSocket from "ws";

const APPID = process.env.XF_APPID!;
const API_KEY = process.env.XF_API_KEY!;
const API_SECRET = process.env.XF_API_SECRET!;

let ffmpeg: FFmpeg | null = null;

/** 初始化 FFmpeg（Node.js 版本） */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  // Node.js 环境下加载 FFmpeg 核心
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

  // 使用 nodeLoad 而不是 load（适用于 Node.js）
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}

/** 使用 FFmpeg 将 webm/opus 转成 16k 单声道 PCM */
async function transcodeWebmToPcm16k(webmBuffer: Buffer): Promise<Buffer> {
  const ff = await getFFmpeg();

  // 写入输入文件
  await ff.writeFile("input.webm", webmBuffer);

  // 转换为 16kHz PCM
  await ff.exec([
    "-i", "input.webm",
    "-f", "s16le",
    "-acodec", "pcm_s16le",
    "-ac", "1",
    "-ar", "16000",
    "output.pcm"
  ]);

  // 读取输出文件
  const outputBuffer = await ff.readFile("output.pcm");

  // 清理临时文件
  await ff.deleteFile("input.webm");
  await ff.deleteFile("output.pcm");

  return Buffer.from(outputBuffer);
}

/** 构建 WebSocket 鉴权 URL */
function buildAuthUrl(): string {
  const host = "iat-api.xfyun.cn";
  const path = "/v2/iat";
  const date = new Date().toUTCString();
  const requestLine = `GET ${path} HTTP/1.1`;

  // 构造签名原始字符串
  const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`;

  // 使用 APISecret 做 HMAC-SHA256
  const signatureSha = crypto
    .createHmac("sha256", API_SECRET)
    .update(signatureOrigin)
    .digest("base64");

  // 构造 authorization 字符串并 Base64
  const authorizationOrigin = `api_key="${API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signatureSha}"`;
  const authorization = Buffer.from(authorizationOrigin).toString("base64");

  // 构建 URL
  const url = new URL(`wss://${host}${path}`);
  url.searchParams.set("authorization", authorization);
  url.searchParams.set("date", date);
  url.searchParams.set("host", host);

  return url.toString();
}

/** 通过 WebSocket 发送音频并获取识别结果 */
function recognizeAudioViaWebSocket(pcmBuffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const wsUrl = buildAuthUrl();
    const ws = new WebSocket(wsUrl);

    let fullText = "";
    let hasError = false;

    ws.on("open", () => {
      // 第一帧
      const firstFrame = {
        common: { app_id: APPID },
        business: {
          language: "zh_cn",
          domain: "iat",
          accent: "mandarin",
          vad_eos: 5000,
        },
        data: {
          status: 0,
          format: "audio/L16;rate=16000",
          encoding: "raw",
          audio: Buffer.from(pcmBuffer.subarray(0, 1280)).toString("base64"),
        },
      };
      ws.send(JSON.stringify(firstFrame));

      // 中间帧
      const frameSize = 1280;
      let offset = 1280;
      while (offset < pcmBuffer.length) {
        const chunk = Buffer.from(pcmBuffer.subarray(offset, offset + frameSize));
        ws.send(JSON.stringify({
          data: { status: 1, format: "audio/L16;rate=16000", encoding: "raw", audio: chunk.toString("base64") }
        }));
        offset += frameSize;
      }

      // 最后一帧
      ws.send(JSON.stringify({ data: { status: 2 } }));
    });

    ws.on("message", (data: WebSocket.Data) => {
      try {
        const json = JSON.parse(data.toString());
        if (json.code !== 0) {
          hasError = true;
          ws.close();
          reject(new Error(json.message || `code: ${json.code}`));
          return;
        }
        if (json.data?.result?.ws) {
          for (const item of json.data.result.ws) {
            for (const cw of item.cw ?? []) {
              if (cw.w) fullText += cw.w;
            }
          }
        }
        if (json.data?.status === 2) {
          ws.close();
          resolve(fullText);
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    });

    ws.on("error", (err) => { hasError = true; reject(err); });
    ws.on("close", (code) => {
      if (!hasError && code !== 1000) reject(new Error(`WS closed: ${code}`));
    });

    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) { ws.close(); reject(new Error("timeout")); }
    }, 60000);
  });
}

export async function POST(req: NextRequest) {
  try {
    const webmBuffer = Buffer.from(await req.arrayBuffer());
    if (!webmBuffer.length) {
      return NextResponse.json({ error: "empty audio" }, { status: 400 });
    }

    const pcmBuffer = await transcodeWebmToPcm16k(webmBuffer);
    const text = await recognizeAudioViaWebSocket(pcmBuffer);

    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("ASR error:", e);
    return NextResponse.json({ error: e?.message ?? "error" }, { status: 500 });
  }
}
