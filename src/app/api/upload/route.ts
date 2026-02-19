import { NextRequest, NextResponse } from 'next/server';
import COS from 'cos-nodejs-sdk-v5';

export const runtime = 'nodejs';

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID!,
  SecretKey: process.env.COS_SECRET_KEY!,
});

function putObject(params: any): Promise<any> {
  return new Promise((resolve, reject) => {
    cos.putObject(params, (err, data) => {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const contentTypeHeader = request.headers.get("content-type") || "";
    const filenameHeader = request.headers.get("x-file-name") || "upload";

    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "上传内容为空" },
        { status: 400 }
      );
    }
    if (buffer.length > maxSize) {
      return NextResponse.json(
        { error: "文件大小不能超过 5MB" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);

    const nameExt =
      typeof filenameHeader === "string" && filenameHeader.includes(".")
        ? filenameHeader.split(".").pop()
        : undefined;

    const mimeType = contentTypeHeader || "application/octet-stream";

    const mimeExt =
      mimeType.startsWith("image/jpeg") ? "jpg" :
      mimeType.startsWith("image/png") ? "png" :
      mimeType.startsWith("image/webp") ? "webp" :
      mimeType.startsWith("image/gif") ? "gif" :
      undefined;
    const extension = nameExt || mimeExt || "png";
    const filename = `upload-${timestamp}-${randomId}.${extension}`;

    const Bucket = process.env.COS_BUCKET;
    const Region = process.env.COS_REGION || 'ap-shanghai';

    if (!Bucket || !Region) {
      return NextResponse.json(
        { error: 'COS 存储未配置，请设置 COS_BUCKET 和 COS_REGION 环境变量' },
        { status: 500 }
      );
    }

    const key = `uploads/${filename}`;

    const params: any = {
      Bucket,
      Region,
      Key: key,
      Body: buffer,
      ContentLength: buffer.length,
      ContentType: mimeType || "image/png",
      // 确保外部服务（如 Kie.ai）可以直接通过 URL 读取图片
      ACL: process.env.COS_OBJECT_ACL || "public-read",
    };

    // 如果需要指定存储类型，可以通过环境变量 COS_STORAGE_CLASS 配置，
    // 避免对多可用区（MAZ）存储桶强行使用单可用区的 StorageClass
    if (process.env.COS_STORAGE_CLASS) {
      params.StorageClass = process.env.COS_STORAGE_CLASS;
    }

    const result = await putObject(params);

    const location: string = result.Location || '';
    const url = location.startsWith('http')
      ? location
      : `https://${location}`;

    return NextResponse.json({
      success: true,
      url,
      filename: key,
      size: buffer.length,
      contentType: mimeType || "image/png"
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        error: `上传失败: ${error?.message ?? String(error)}`,
        name: error?.name,
        code: error?.code,
      },
      { status: 500 }
    );
  }
}
