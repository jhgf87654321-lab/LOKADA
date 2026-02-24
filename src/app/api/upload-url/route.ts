import { NextRequest, NextResponse } from 'next/server';
import COS from 'cos-nodejs-sdk-v5';

export const runtime = 'nodejs';

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID!,
  SecretKey: process.env.COS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType } = body;

    const COS_SECRET_ID = process.env.COS_SECRET_ID;
    const COS_SECRET_KEY = process.env.COS_SECRET_KEY;
    const Bucket = process.env.COS_BUCKET;
    const Region = process.env.COS_REGION || 'ap-shanghai';

    // 调试日志
    console.log("DEBUG - COS_SECRET_ID:", COS_SECRET_ID ? "已配置" : "未配置");
    console.log("DEBUG - COS_SECRET_KEY:", COS_SECRET_KEY ? "已配置" : "未配置");
    console.log("DEBUG - COS_BUCKET:", Bucket);
    console.log("DEBUG - COS_REGION:", Region);

    if (!Bucket || !/^[a-z0-9]+-\d+$/.test(Bucket)) {
      return NextResponse.json(
        { error: 'COS_BUCKET not configured' },
        { status: 500 }
      );
    }

    // 生成唯一的文件名
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const ext = filename?.split('.').pop() || 'png';
    const key = `uploads/${timestamp}-${randomId}.${ext}`;

    console.log("Generating presigned URL for key:", key);

    // 生成预签名 URL（PUT 方法，用于上传）
    const presignedUrl = await new Promise<string>((resolve, reject) => {
      cos.getObjectUrl({
        Bucket,
        Region,
        Key: key,
        Method: 'PUT',
        Headers: {
          'Content-Type': contentType || 'image/png',
        },
        Expires: 300, // 5分钟有效期
        Sign: true,
      }, (err, data) => {
        if (err) {
          console.error("COS getObjectUrl error:", err);
          return reject(err);
        }
        console.log("Presigned URL generated:", data.Url);
        resolve(data.Url);
      });
    });

    return NextResponse.json({
      success: true,
      uploadUrl: presignedUrl,
      key,
      url: `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`
    });
  } catch (error: any) {
    console.error('Generate presigned URL error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
