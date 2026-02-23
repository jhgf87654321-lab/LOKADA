import { NextRequest, NextResponse } from "next/server";
import * as tencentcloud from "tencentcloud-sdk-nodejs";

export const runtime = "nodejs";

const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID;
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY;
const TENCENT_ASR_REGION = process.env.TENCENT_ASR_REGION || "ap-guangzhou";

// 腾讯云 ASR 客户端类
const AsrClient = tencentcloud.asr.v20190614.Client;

/** 从文件头检测音频格式 */
function detectAudioFormat(buffer: Buffer): { format: string; sourceType: number } {
  if (buffer.length < 4) {
    return { format: "ogg-opus", sourceType: 1 };
  }

  const header = buffer.slice(0, 4).toString("hex").toUpperCase();

  // 检测常见音频格式
  if (header.startsWith("52494646")) {
    // RIFF - WAV
    return { format: "wav", sourceType: 1 };
  }
  if (header.startsWith("494433") || header.startsWith("FFFB") || header.startsWith("FFF3")) {
    // ID3 or MPEG frame - MP3
    return { format: "mp3", sourceType: 1 };
  }
  if (header.startsWith("664C6143")) {
    // fLaC - FLAC
    return { format: "flac", sourceType: 1 };
  }
  if (header.startsWith("4F676753")) {
    // OggS - OGG
    return { format: "ogg", sourceType: 1 };
  }
  if (header.startsWith("234F5044") || header.startsWith("4F5044")) {
    // #ODS or OPD - Silk
    return { format: "silk", sourceType: 1 };
  }
  if (header.startsWith("1AE3")) {
    // M4A/AAC
    return { format: "m4a", sourceType: 1 };
  }

  // WebM/Opus 格式检测 (webm 文件头以 EBML 头开始)
  const fullHeader = buffer.slice(0, 20).toString("hex").toUpperCase();
  if (fullHeader.startsWith("1A45DFA3")) {
    // 腾讯云支持 ogg-opus 格式
    return { format: "ogg-opus", sourceType: 1 };
  }

  // 默认返回 ogg-opus (浏览器录音常用格式)
  return { format: "ogg-opus", sourceType: 1 };
}

/** 腾讯云一句话识别 */
async function recognizeWithTencentASR(audioBuffer: Buffer): Promise<string> {
  if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY) {
    throw new Error("腾讯云 ASR 未配置");
  }

  // 检测音频格式
  const { format, sourceType } = detectAudioFormat(audioBuffer);

  // 创建客户端
  const client = new AsrClient({
    credential: {
      secretId: TENCENT_SECRET_ID,
      secretKey: TENCENT_SECRET_KEY,
    },
    region: TENCENT_ASR_REGION,
  });

  // Base64 编码音频数据
  const base64Data = audioBuffer.toString("base64");

  // 请求参数
  const params = {
    Data: base64Data,
    EngSerViceType: "16k_zh",
    SourceType: sourceType,
    VoiceFormat: format,
    UsrAudioKey: `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };

  try {
    const response: any = await client.SentenceRecognition(params);

    if (response.Result) {
      return response.Result;
    }
    return "";
  } catch (err: unknown) {
    console.error("ASR SDK 错误:", err);

    // 尝试提取更详细的错误信息
    let errorDetails = "";
    if (err && typeof err === "object") {
      const errObj = err as Record<string, unknown>;
      errorDetails = errObj.code ? ` (code: ${errObj.code})` : "";
      if (errObj.requestId) {
        errorDetails += ` RequestId: ${errObj.requestId}`;
      }
    }

    const errorMessage = err instanceof Error ? err.message : "未知错误";
    throw new Error(`腾讯云 ASR 错误: ${errorMessage}${errorDetails}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY) {
      return NextResponse.json({ error: "腾讯云 ASR 未配置" }, { status: 500 });
    }

    const raw = Buffer.from(await req.arrayBuffer());

    if (!raw.length) {
      return NextResponse.json({ error: "音频数据为空" }, { status: 400 });
    }

    // 大小检查（一句话识别最大 5MB）
    if (raw.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "音频文件过大，最大支持 5MB" }, { status: 400 });
    }

    const text = await recognizeWithTencentASR(raw);
    return NextResponse.json({ text });
  } catch (e: unknown) {
    console.error("ASR error:", e);
    const message = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
