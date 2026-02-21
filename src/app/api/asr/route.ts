import { NextRequest, NextResponse } from "next/server";
import COS from "cos-nodejs-sdk-v5";
import { put, del } from "@vercel/blob";

export const runtime = "nodejs";

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY!;
const COS_SECRET_ID = process.env.COS_SECRET_ID;
const COS_SECRET_KEY = process.env.COS_SECRET_KEY;
const COS_BUCKET = process.env.COS_BUCKET;
const COS_REGION = process.env.COS_REGION || "ap-shanghai";
const DASHSCOPE_API = "https://dashscope.aliyuncs.com/api/v1";

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** 阿里云 DashScope Paraformer 录音文件识别（支持 webm，无需 ffmpeg） */
async function recognizeWithParaformer(fileUrl: string): Promise<string> {
  // 1. 提交异步任务
  const submitRes = await fetchWithTimeout(`${DASHSCOPE_API}/services/audio/asr/transcription`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify({
      model: "paraformer-realtime-v2",
      input: { file_urls: [fileUrl] },
      parameters: { language_hints: ["zh", "en"] },
    }),
  }, 15000);

  const submitJson = (await submitRes.json()) as {
    output?: { task_id?: string; task_status?: string };
    code?: string;
    message?: string;
  };

  if (submitJson.code) {
    const err = new Error(submitJson.message ?? `DashScope error: ${submitJson.code}`) as Error & { details?: string };
    err.details = JSON.stringify({ submit: submitJson, fileUrl });
    throw err;
  }
  const taskId = submitJson.output?.task_id;
  if (!taskId) {
    throw new Error("DashScope 未返回 task_id");
  }

  // 2. 轮询任务状态
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const fetchRes = await fetchWithTimeout(`${DASHSCOPE_API}/tasks/${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`,
      },
    }, 10000);
    const fetchJson = (await fetchRes.json()) as {
      output?: {
        task_status?: string;
        results?: Array<{
          transcription_url?: string;
          subtask_status?: string;
        }>;
      };
      code?: string;
      message?: string;
    };

    if (fetchJson.code) {
      const err = new Error(fetchJson.message ?? `DashScope fetch error: ${fetchJson.code}`) as Error & { details?: string };
      err.details = JSON.stringify({ fetch: fetchJson, fileUrl });
      throw err;
    }

    const status = fetchJson.output?.task_status;
    if (status === "SUCCEEDED") {
      const results = fetchJson.output?.results;
      const first = results?.[0];
      const transUrl = first?.transcription_url;
      if (!transUrl) return "";

      const transRes = await fetch(transUrl);
      const transJson = (await transRes.json()) as {
        transcript?: string;
        sentences?: Array<{ text?: string }>;
        sentence?: Array<{ text?: string }>;
      };
      const sentences = transJson.sentences ?? transJson.sentence ?? [];
      const text =
        transJson.transcript ??
        sentences.map((s) => s.text ?? "").join("") ??
        "";
      return text.trim();
    }
    if (status === "FAILED") {
      const details = JSON.stringify(fetchJson);
      const err = new Error("语音识别任务失败") as Error & { details?: string };
      err.details = JSON.stringify({ fetch: fetchJson, fileUrl });
      throw err;
    }
  }

  throw new Error("语音识别超时");
}

async function uploadToCos(buffer: Buffer): Promise<string | null> {
  if (!COS_SECRET_ID || !COS_SECRET_KEY || !COS_BUCKET) return null;
  const cos = new COS({ SecretId: COS_SECRET_ID, SecretKey: COS_SECRET_KEY });
  const key = `asr/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
  const result = await new Promise<{ Location?: string }>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: key,
        Body: buffer,
        ContentType: "audio/webm",
      },
      (err, data) => {
        if (err) return reject(err);
        resolve(data as { Location?: string });
      }
    );
  });
  const location = result.Location || "";
  return location.startsWith("http") ? location : `https://${location}`;
}

export async function POST(req: NextRequest) {
  try {
    if (!DASHSCOPE_API_KEY || /[\u0080-\uFFFF]/.test(DASHSCOPE_API_KEY)) {
      return NextResponse.json(
        { error: "Invalid DASHSCOPE_API_KEY. 请替换为阿里云百炼/Model Studio 的真实 API Key" },
        { status: 500 }
      );
    }

    const raw = Buffer.from(await req.arrayBuffer());
    if (!raw.length) {
      return NextResponse.json({ error: "empty audio" }, { status: 400 });
    }

    // 优先上传到 COS（更容易被阿里云访问）；否则回退到 Vercel Blob
    const cosUrl = await uploadToCos(raw);
    if (cosUrl) {
      const text = await recognizeWithParaformer(cosUrl);
      return NextResponse.json({ text });
    }

    const blob = await put(`asr-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`, raw, {
      access: "public",
      contentType: "audio/webm",
    });

    try {
      const text = await recognizeWithParaformer(blob.url);
      return NextResponse.json({ text });
    } finally {
      await del(blob.url).catch(() => {});
    }
  } catch (e: unknown) {
    console.error("ASR error:", e);
    const message = e instanceof Error ? e.message : "error";
    const details = e && typeof e === "object" && "details" in e ? (e as { details?: string }).details : undefined;
    return NextResponse.json({ error: message, details }, { status: 500 });
  }
}
