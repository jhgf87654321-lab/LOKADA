import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import COS from "cos-nodejs-sdk-v5";
import { put, del } from "@vercel/blob";

export const runtime = "nodejs";

const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID;
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY;
const TENCENT_APP_ID = process.env.TENCENT_APP_ID;
const COS_SECRET_ID = process.env.COS_SECRET_ID;
const COS_SECRET_KEY = process.env.COS_SECRET_KEY;
const COS_BUCKET = process.env.COS_BUCKET;
const COS_REGION = process.env.COS_REGION || "ap-shanghai";

/** 生成腾讯云 API 签名 */
function generateSignature({
  secretId,
  secretKey,
  method,
  pathname,
  query,
  payload,
  timestamp,
}: {
  secretId: string;
  secretKey: string;
  method: string;
  pathname: string;
  query: Record<string, string>;
  payload: string;
  timestamp: number;
}) {
  // 1. 拼接规范请求串
  const canonicalUri = pathname;
  const canonicalQueryString = Object.keys(query)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join("&");
  const hashedRequestPayload = crypto.createHash("sha256").update(payload).digest("hex");
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    `content-type:application/json\nhost:asr.tencentcloudapi.com\n`,
    "content-type;host",
    hashedRequestPayload,
  ].join("\n");

  // 2. 拼接待签名字符串
  const algorithm = "TC3-HMAC-SHA256";
  const date = new Date(timestamp * 1000).toISOString().split("T")[0].replace(/-/g, "");
  const credentialScope = `${date}/asr/tc3_request`;
  const hashedCanonicalRequest = crypto
    .createHash("sha256")
    .update(canonicalRequest)
    .digest("hex");
  const stringToSign = [
    algorithm,
    timestamp,
    credentialScope,
    hashedCanonicalRequest,
  ].join("\n");

  // 3. 计算签名
  const secretDate = crypto
    .createHmac("sha256", "TC3" + secretKey)
    .update(date)
    .digest();
  const secretSign = crypto
    .createHmac("sha256", secretDate)
    .update("asr")
    .digest();
  const signature = crypto
    .createHmac("sha256", secretSign)
    .update(stringToSign)
    .digest("hex");

  // 4. 拼接 Authorization
  const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;

  return authorization;
}

/** 腾讯云录音文件识别 */
async function recognizeWithTencentASR(fileUrl: string): Promise<string> {
  if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY || !TENCENT_APP_ID) {
    throw new Error("腾讯云 ASR 未配置：请设置 TENCENT_SECRET_ID、TENCENT_SECRET_KEY、TENCENT_APP_ID");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const endpoint = "asr.tencentcloudapi.com";
  const pathname = "/";

  const payload = JSON.stringify({
    EngineType: "16k_zh",
    Url: fileUrl,
    SecretId: TENCENT_SECRET_ID,
    Timestamp: timestamp,
    Nonce: Math.floor(Math.random() * 1000000),
    // TaskId 不需要，异步任务会自动创建
  });

  const authorization = generateSignature({
    secretId: TENCENT_SECRET_ID,
    secretKey: TENCENT_SECRET_KEY,
    method: "POST",
    pathname,
    query: {},
    payload,
    timestamp,
  });

  const response = await fetch(`https://${endpoint}${pathname}`, {
    method: "POST",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      Host: endpoint,
      "X-TC-Action": "CreateRecTask",
      "X-TC-Version": "2019-06-14",
      "X-TC-Timestamp": String(timestamp),
    },
    body: payload,
  });

  const result = (await response.json()) as {
    Response?: {
      TaskId?: number;
      RequestId?: string;
      Error?: { Code: string; Message: string };
    };
  };

  if (result.Response?.Error) {
    throw new Error(`腾讯云 ASR 错误: ${result.Response.Error.Message} (${result.Response.Error.Code})`);
  }

  const taskId = result.Response?.TaskId;
  if (!taskId) {
    throw new Error("腾讯云 ASR 未返回 TaskId");
  }

  // 轮询任务状态
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 2000));

    const statusPayload = JSON.stringify({
      TaskId: taskId,
      SecretId: TENCENT_SECRET_ID,
      Timestamp: timestamp,
      Nonce: Math.floor(Math.random() * 1000000),
    });

    const statusAuth = generateSignature({
      secretId: TENCENT_SECRET_ID,
      secretKey: TENCENT_SECRET_KEY,
      method: "POST",
      pathname,
      query: {},
      payload: statusPayload,
      timestamp,
    });

    const statusResponse = await fetch(`https://${endpoint}${pathname}`, {
      method: "POST",
      headers: {
        Authorization: statusAuth,
        "Content-Type": "application/json",
        Host: endpoint,
        "X-TC-Action": "GetTaskStatus",
        "X-TC-Version": "2019-06-14",
        "X-TC-Timestamp": String(timestamp),
      },
      body: statusPayload,
    });

    const statusResult = (await statusResponse.json()) as {
      Response?: {
        Status?: number;
        Result?: string;
        RequestId?: string;
        Error?: { Code: string; Message: string };
      };
    };

    if (statusResult.Response?.Error) {
      throw new Error(`腾讯云 ASR 状态错误: ${statusResult.Response.Error.Message}`);
    }

    const status = statusResult.Response?.Status;
    // Status: 0=等待中, 1=成功, 2=失败, 3=进行中
    if (status === 1) {
      const resultText = statusResult.Response?.Result;
      if (resultText) {
        // 解析 JSON 格式的识别结果
        try {
          const parsed = JSON.parse(resultText);
          // 提取识别文本
          const sentences = parsed?.sentence_info?.map((s: { text: string }) => s.text).join("") || "";
          return sentences;
        } catch {
          return resultText;
        }
      }
      return "";
    }
    if (status === 2) {
      throw new Error(`腾讯云 ASR 任务失败: ${statusResult.Response?.Result}`);
    }
  }

  throw new Error("腾讯云 ASR 任务超时");
}

async function uploadToCos(buffer: Buffer): Promise<string | null> {
  if (!COS_SECRET_ID || !COS_SECRET_KEY || !COS_BUCKET) return null;
  const cos = new COS({ SecretId: COS_SECRET_ID, SecretKey: COS_SECRET_KEY });
  const key = `asr/${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;

  // 上传到 COS
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

  // 生成签名 URL（7天有效期）
  const signedUrl = cos.getObjectUrl({
    Bucket: COS_BUCKET,
    Region: COS_REGION,
    Key: key,
    Sign: true,
    Expires: 604800,
    protocol: "https:",
  });

  return signedUrl;
}

export async function POST(req: NextRequest) {
  try {
    if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY || !TENCENT_APP_ID) {
      return NextResponse.json(
        { error: "腾讯云 ASR 未配置：请在 Vercel 环境变量中设置 TENCENT_SECRET_ID、TENCENT_SECRET_KEY、TENCENT_APP_ID" },
        { status: 500 }
      );
    }

    const raw = Buffer.from(await req.arrayBuffer());
    if (!raw.length) {
      return NextResponse.json({ error: "empty audio" }, { status: 400 });
    }

    // 优先上传到 COS
    const cosUrl = await uploadToCos(raw);
    if (cosUrl) {
      const text = await recognizeWithTencentASR(cosUrl);
      return NextResponse.json({ text });
    }

    // 回退到 Vercel Blob
    const blob = await put(`asr-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`, raw, {
      access: "public",
      contentType: "audio/webm",
    });

    try {
      const text = await recognizeWithTencentASR(blob.url);
      return NextResponse.json({ text });
    } finally {
      await del(blob.url).catch(() => {});
    }
  } catch (e: unknown) {
    console.error("ASR error:", e);
    const message = e instanceof Error ? e.message : "error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
