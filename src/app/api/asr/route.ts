import { NextRequest, NextResponse } from "next/server";
import COS from "cos-nodejs-sdk-v5";
import { put } from "@vercel/blob";
import crypto from "crypto";

export const runtime = "nodejs";

const TENCENT_SECRET_ID = process.env.TENCENT_SECRET_ID;
const TENCENT_SECRET_KEY = process.env.TENCENT_SECRET_KEY;
const TENCENT_APP_ID = process.env.TENCENT_APP_ID;
const COS_SECRET_ID = process.env.COS_SECRET_ID;
const COS_SECRET_KEY = process.env.COS_SECRET_KEY;
const COS_BUCKET = process.env.COS_BUCKET;
const COS_REGION = process.env.COS_REGION || "ap-shanghai";

/** 生成腾讯云 TC3 签名 - 正确的日期格式 */
function generateTC3Authorization(secretId: string, secretKey: string, method: string, pathname: string, query: Record<string, string>, payload: string) {
  const timestamp = Math.floor(Date.now() / 1000);
  // 关键：日期格式必须是 YYYY-MM-DD（带连字符）
  const date = new Date(timestamp * 1000).toISOString().split("T")[0];

  console.log("签名参数:", { secretId: secretId?.slice(0, 10), timestamp, date });

  // 1. 规范请求串
  const canonicalUri = pathname || "/";
  const canonicalQueryString = Object.keys(query).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`).join("&");
  const hashedPayload = crypto.createHash("sha256").update(payload).digest("hex");

  const canonicalHeaders = `content-type:application/json\nhost:asr.tencentcloudapi.com\n`;
  const signedHeaders = "content-type;host";

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    hashedPayload
  ].join("\n");

  // 2. 拼接待签名字符串
  const algorithm = "TC3-HMAC-SHA256";
  const credentialScope = `${date}/asr/tc3_request`;
  const hashedCanonicalRequest = crypto.createHash("sha256").update(canonicalRequest).digest("hex");

  const stringToSign = [
    algorithm,
    timestamp,
    credentialScope,
    hashedCanonicalRequest
  ].join("\n");

  // 3. 计算签名
  const secretDate = crypto.createHmac("sha256", "TC3" + secretKey).update(date).digest();
  const secretService = crypto.createHmac("sha256", secretDate).update("asr").digest();
  const secretSigning = crypto.createHmac("sha256", secretService).update("tc3_request").digest();
  const signature = crypto.createHmac("sha256", secretSigning).update(stringToSign).digest("hex");

  // 4. 拼接 Authorization
  const auth = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  console.log("Authorization:", auth.slice(0, 80) + "...");

  return auth;
}

/** 腾讯云录音文件识别 - 使用 HTTP API */
async function recognizeWithTencentASR(fileUrl: string): Promise<string> {
  if (!TENCENT_SECRET_ID || !TENCENT_SECRET_KEY || !TENCENT_APP_ID) {
    throw new Error("腾讯云 ASR 未配置");
  }

  const endpoint = "asr.tencentcloudapi.com";
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().split("T")[0];

  // 创建识别任务
  const payload = JSON.stringify({
    EngineType: "16k_zh",
    Url: fileUrl,
  });

  console.log("创建腾讯云 ASR 任务...");
  console.log("日期:", date);

  const auth = generateTC3Authorization(
    TENCENT_SECRET_ID,
    TENCENT_SECRET_KEY,
    "POST",
    "/",
    {},
    payload
  );

  const response = await fetch(`https://${endpoint}/`, {
    method: "POST",
    headers: {
      Authorization: auth,
      "Content-Type": "application/json",
      Host: endpoint,
      "X-TC-Action": "CreateRecTask",
      "X-TC-Version": "2019-06-14",
      "X-TC-Timestamp": String(timestamp),
    },
    body: payload,
  });

  const result = await response.json();
  console.log("ASR 响应:", JSON.stringify(result).slice(0, 500));

  if (result.Response?.Error) {
    throw new Error(`腾讯云 ASR 错误: ${result.Response.Error.Message}`);
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
    });

    const statusAuth = generateTC3Authorization(
      TENCENT_SECRET_ID,
      TENCENT_SECRET_KEY,
      "POST",
      "/",
      {},
      statusPayload
    );

    const statusResponse = await fetch(`https://${endpoint}/`, {
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

    const statusResult = await statusResponse.json();
    console.log(`轮询状态 (${i + 1}/30):`, statusResult);

    if (statusResult.Response?.Error) {
      throw new Error(`腾讯云 ASR 状态错误: ${statusResult.Response.Error.Message}`);
    }

    const status = statusResult.Response?.Status;
    if (status === 1) {
      const resultText = statusResult.Response?.Result;
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
      throw new Error(`腾讯云 ASR 任务失败: ${statusResult.Response?.Result}`);
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
    console.log("TENCENT_SECRET_ID:", TENCENT_SECRET_ID?.slice(0, 10));
    console.log("TENCENT_APP_ID:", TENCENT_APP_ID);

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
