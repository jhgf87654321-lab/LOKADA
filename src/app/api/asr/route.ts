import { NextRequest, NextResponse } from "next/server";
import COS from "cos-nodejs-sdk-v5";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID || process.env.COS_SECRET_ID;
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY || process.env.COS_SECRET_KEY;
const TENCENT_APP_ID = process.env.TENCENT_APP_ID || process.env.COS_SECRET_ID?.replace(/^\d+-/, "")?.split(".")[0];
const COS_SECRET_ID = process.env.COS_SECRET_ID;
const COS_SECRET_KEY = process.env.COS_SECRET_KEY;
const COS_BUCKET = process.env.COS_BUCKET;
const COS_REGION = process.env.COS_REGION || "ap-shanghai";

/** 腾讯云录音文件识别 */
async function recognizeWithTencentASR(fileUrl: string): Promise<string> {
  if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY || !TENCENT_APP_ID) {
    throw new Error("腾讯云 ASR 未配置");
  }

  // 动态导入腾讯云 SDK
  const tencentcloud = await import("tencentcloud-sdk-nodejs");
  const AsrClient = tencentcloud.asr.v20190614.Client;
  const Credential = tencentcloud.common.Credential;

  const cred = new Credential(TENCENT_SECRET_ID, TENCENT_SECRET_KEY);
  const client = new AsrClient(cred, "ap-shanghai");

  // 为 SDK 设置 fetch（Node.js 18+ 需要）
  // @ts-ignore
  if (typeof globalThis.fetch === "undefined") {
    const { default: fetch } = await import("node-fetch");
    // @ts-ignore
    globalThis.fetch = fetch;
    // @ts-ignore
    globalThis.Response = fetch.Response;
  }

  // 使用回调包装为 Promise
  const createTask = (params: any) => new Promise((resolve, reject) => {
    client.CreateRecTask(params, (err: any, response: any) => {
      if (err) reject(err);
      else resolve(response);
    });
  });

  const getTaskStatus = (params: any) => new Promise((resolve, reject) => {
    client.DescribeTaskStatus(params, (err: any, response: any) => {
      if (err) reject(err);
      else resolve(response);
    });
  });

  // 创建识别任务
  const createParams = {
    EngineType: "16k_zh",
    Url: fileUrl,
  };

  console.log("创建腾讯云 ASR 任务...");

  const createResult = await createTask(createParams) as any;
  console.log("ASR 任务创建结果:", createResult);

  if (createResult.Error) {
    throw new Error(`腾讯云 ASR 错误: ${createResult.Error.Message}`);
  }

  const taskId = createResult.TaskId;
  if (!taskId) {
    throw new Error("腾讯云 ASR 未返回 TaskId");
  }

  // 轮询任务状态
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusResult = await getTaskStatus({ TaskId: taskId }) as any;
    console.log(`轮询任务状态 (${i + 1}/30):`, statusResult);

    const status = statusResult.Status;
    if (status === 1) {
      const resultText = statusResult.Result;
      if (resultText) {
        try {
          const parsed = JSON.parse(resultText);
          const sentences = parsed?.sentence_info?.map((s: { text: string }) => s.text).join("") || "";
          return sentences;
        } catch {
          return resultText;
        }
      }
      return "";
    }
    if (status === 2) {
      throw new Error(`腾讯云 ASR 任务失败: ${statusResult.ErrorMessage}`);
    }
  }

  throw new Error("腾讯云 ASR 任务超时");
}

async function uploadToCos(buffer: Buffer): Promise<string | null> {
  if (!COS_SECRET_ID || !COS_SECRET_KEY || !COS_BUCKET) return null;
  const cos = new COS({ SecretId: COS_SECRET_ID, SecretKey: COS_SECRET_KEY });
  const key = `asr/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;

  await new Promise<void>((resolve, reject) => {
    cos.putObject(
      {
        Bucket: COS_BUCKET,
        Region: COS_REGION,
        Key: key,
        Body: buffer,
        ContentType: "audio/webm",
      },
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });

  const signedUrl = cos.getObjectUrl({
    Bucket: COS_BUCKET,
    Region: COS_REGION,
    Key: key,
    Sign: true,
    Expires: 604800,
    Protocol: "https:",
  });

  return signedUrl;
}

export async function POST(req: NextRequest) {
  try {
    console.log("ASR 请求 received");

    if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY || !TENCENT_APP_ID) {
      return NextResponse.json({ error: "腾讯云 ASR 未配置" }, { status: 500 });
    }

    const raw = Buffer.from(await req.arrayBuffer());
    console.log("收到音频数据:", raw.length, "bytes");

    if (!raw.length) {
      return NextResponse.json({ error: "empty audio" }, { status: 400 });
    }

    const cosUrl = await uploadToCos(raw);
    if (!cosUrl) {
      const blob = await put(`asr-${Date.now()}.webm`, raw, {
        access: "public",
        contentType: "audio/webm",
      });
      const text = await recognizeWithTencentASR(blob.url);
      return NextResponse.json({ text });
    }

    console.log("COS URL:", cosUrl);
    const text = await recognizeWithTencentASR(cosUrl);
    return NextResponse.json({ text });
  } catch (e: unknown) {
    console.error("ASR error:", e);
    const message = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
