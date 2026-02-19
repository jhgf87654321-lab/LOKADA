import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import ffmpegPath from "ffmpeg-static";
import WebSocket from "ws";

const APPID = process.env.XF_APPID!;
const API_KEY = process.env.XF_API_KEY!;
const API_SECRET = process.env.XF_API_SECRET!;

/** 解析 ffmpeg 可执行文件路径（兼容 Turbopack 下 ffmpeg-static 返回异常路径的情况） */
function getFfmpegBin(): string {
  const envPath = process.env.FFMPEG_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const fromPkg = ffmpegPath as string | null | undefined;
  if (fromPkg && fs.existsSync(fromPkg)) return fromPkg;

  const cwdFallback = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe");
  if (fs.existsSync(cwdFallback)) return cwdFallback;

  return "ffmpeg";
}

function transcodeWebmToPcm16k(input: Buffer): Promise<Buffer> {
  const bin = getFfmpegBin();
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn(bin, [
      "-i",
      "pipe:0",
      "-f",
      "s16le",
      "-acodec",
      "pcm_s16le",
      "-ac",
      "1",
      "-ar",
      "16000",
      "pipe:1",
    ]);

    const chunks: Buffer[] = [];

    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (d) => {
      // 可按需打开日志
      // console.error("ffmpeg:", d.toString());
    });
    ffmpeg.on("error", (err) => reject(err));
    ffmpeg.on("close", (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`ffmpeg exit code ${code}`));
    });

    ffmpeg.stdin.end(input);
  });
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
      // 第一帧：发送 common + business + data（status=0）
      const firstFrame = {
        common: {
          app_id: APPID,
        },
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
          audio: pcmBuffer.slice(0, 1280).toString("base64"), // 第一帧：1280字节
        },
      };
      ws.send(JSON.stringify(firstFrame));

      // 中间帧：分帧发送音频（每帧1280字节，status=1）
      const frameSize = 1280;
      let offset = 1280;
      while (offset < pcmBuffer.length) {
        const chunk = pcmBuffer.slice(offset, offset + frameSize);
        const frame = {
          data: {
            status: 1,
            format: "audio/L16;rate=16000",
            encoding: "raw",
            audio: chunk.toString("base64"),
          },
        };
        ws.send(JSON.stringify(frame));
        offset += frameSize;
      }

      // 最后一帧：发送结束标识（status=2）
      const lastFrame = {
        data: {
          status: 2,
        },
      };
      ws.send(JSON.stringify(lastFrame));
    });

    ws.on("message", (data: WebSocket.Data) => {
      try {
        const json = JSON.parse(data.toString());
        
        if (json.code !== 0) {
          hasError = true;
          console.error("iFlytek ASR error:", JSON.stringify(json, null, 2));
          ws.close();
          reject(new Error(json.message || json.desc || `code: ${json.code}`));
          return;
        }

        // 解析识别结果
        if (json.data?.result?.ws) {
          let text = "";
          for (const item of json.data.result.ws) {
            for (const cw of item.cw ?? []) {
              if (cw.w) text += cw.w;
            }
          }
          fullText += text;
        }

        // 检查是否结束
        if (json.data?.status === 2) {
          ws.close();
          resolve(fullText);
        }
      } catch (e) {
        console.error("Parse WebSocket message error:", e);
      }
    });

    ws.on("error", (error) => {
      hasError = true;
      console.error("WebSocket error:", error);
      reject(error);
    });

    ws.on("close", (code, reason) => {
      if (!hasError && code !== 1000) {
        reject(new Error(`WebSocket closed unexpectedly: ${code} ${reason}`));
      }
    });

    // 设置超时（60秒）
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        if (!hasError) {
          reject(new Error("WebSocket timeout"));
        }
      }
    }, 60000);
  });
}

export async function POST(req: NextRequest) {
  try {
    const webmBuffer = Buffer.from(await req.arrayBuffer());
    if (!webmBuffer.length) {
      return NextResponse.json({ error: "empty audio" }, { status: 400 });
    }

    // 使用 ffmpeg 将 webm/opus 转成 16k 单声道 PCM（raw）
    const pcmBuffer = await transcodeWebmToPcm16k(webmBuffer);

    // 通过 WebSocket 发送音频并获取识别结果
    const text = await recognizeAudioViaWebSocket(pcmBuffer);

    return NextResponse.json({ text });
  } catch (e: any) {
    console.error("ASR internal error:", e);
    return NextResponse.json(
      { error: e?.message ?? "internal error", details: {} },
      { status: 500 },
    );
  }
}
