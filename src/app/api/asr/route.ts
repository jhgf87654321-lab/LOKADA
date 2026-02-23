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

  if (header.startsWith("52494646")) {
    return { format: "wav", sourceType: 1 };
  }
  if (header.startsWith("494433") || header.startsWith("FFFB") || header.startsWith("FFF3")) {
    return { format: "mp3", sourceType: 1 };
  }
  if (header.startsWith("664C6143")) {
    return { format: "flac", sourceType: 1 };
  }
  if (header.startsWith("4F676753")) {
    return { format: "ogg", sourceType: 1 };
  }
  if (header.startsWith("234F5044") || header.startsWith("4F5044")) {
    return { format: "silk", sourceType: 1 };
  }
  if (header.startsWith("1AE3")) {
    return { format: "m4a", sourceType: 1 };
  }

  const fullHeader = buffer.slice(0, 20).toString("hex").toUpperCase();
  if (fullHeader.startsWith("1A45DFA3")) {
    return { format: "ogg-opus", sourceType: 1 };
  }

  return { format: "ogg-opus", sourceType: 1 };
}

/** 腾讯云一句话识别 */
async function recognizeWithTencentASR(audioBuffer: Buffer): Promise<string> {
  if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY) {
    throw new Error("ASR not configured");
  }

  const { format, sourceType } = detectAudioFormat(audioBuffer);

  // 创建客户端，添加完整的配置
  const client = new AsrClient({
    credential: {
      secretId: TENCENT_SECRET_ID,
      secretKey: TENCENT_SECRET_KEY,
    },
    region: TENCENT_ASR_REGION,
    profile: {
      httpProfile: {
        endpoint: "asr.tencentcloudapi.com",
        reqMethod: "POST",
        reqTimeout: 60,
      },
    },
  });

  const base64Data = audioBuffer.toString("base64");

  const params = {
    Data: base64Data,
    EngSerViceType: "16k_zh",
    SourceType: sourceType,
    VoiceFormat: format,
    UsrAudioKey: `audio_${Date.now()}`,
  };

  try {
    const response: any = await client.SentenceRecognition(params);

    if (response.Result) {
      return response.Result;
    }
    return "";
  } catch (err: unknown) {
    console.error("ASR SDK error:", err);

    let errorCode = "UNKNOWN";
    let requestId = "";
    if (err && typeof err === "object") {
      const errObj = err as Record<string, unknown>;
      if (errObj.code) errorCode = String(errObj.code);
      if (errObj.requestId) requestId = String(errObj.requestId);
    }

    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    throw new Error(`ASR_ERROR: ${errorCode}${requestId ? `|${requestId}` : ""}|${errorMessage}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY) {
      return NextResponse.json({ error: "ASR not configured" }, { status: 500 });
    }

    const raw = Buffer.from(await req.arrayBuffer());

    if (!raw.length) {
      return NextResponse.json({ error: "Empty audio data" }, { status: 400 });
    }

    if (raw.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio too large, max 5MB" }, { status: 400 });
    }

    const text = await recognizeWithTencentASR(raw);
    return NextResponse.json({ text });
  } catch (e: unknown) {
    console.error("ASR error:", e);
    const message = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
