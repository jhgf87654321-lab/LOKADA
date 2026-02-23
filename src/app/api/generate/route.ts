import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const KIE_AI_API_URL = "https://api.kie.ai/api/v1/jobs/createTask";
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// 调试日志
console.log("DEBUG - KIE_AI_API_KEY:", process.env.KIE_AI_API_KEY ? `已配置(${process.env.KIE_AI_API_KEY.substring(0, 8)}...)` : "未配置");

export async function POST(_request: NextRequest) {
  try {
    // 在请求处理时重新读取环境变量，避免模块缓存问题
    const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY;

    const headersList = await headers();
    console.log("API Headers:", headersList.get("cookie"));
    const body = await _request.json();

    const {
      prompt,
      originalImageUrl,
      aspectRatio = "1:1",
      resolution = "2K",
      outputFormat = "png",
      model = "nano-banana-pro"
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Prepare image_input if original image is provided
    const imageInput = originalImageUrl ? [originalImageUrl] : [];

    // Call Kie.ai API to create task
    if (!KIE_AI_API_KEY) {
      return NextResponse.json(
        { error: "KIE_AI_API_KEY 未配置，请设置环境变量" },
        { status: 500 }
      );
    }

    const kieResponse = await fetch(KIE_AI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KIE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        input: {
          prompt,
          image_input: imageInput,
          aspect_ratio: aspectRatio,
          resolution,
          output_format: outputFormat,
        },
        callBackUrl: `${NEXT_PUBLIC_BASE_URL}/api/callback`,
      }),
    });

    const kieData = await kieResponse.json();

    if (!kieResponse.ok) {
      console.error("Kie.ai API error:", kieData);
      return NextResponse.json(
        { error: "Failed to create generation task", details: kieData },
        { status: kieResponse.status }
      );
    }

    const taskId = kieData.data?.taskId as string | undefined;

    if (!taskId) {
      return NextResponse.json(
        { error: "Invalid response from Kie.ai API" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      taskId,
      message: "Generation task created successfully",
    });
  } catch (error: unknown) {
    console.error("Generate API error:", error);
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: string }).message)
        : "Internal server error";
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string | number }).code)
        : undefined;
    const cause =
      error && typeof error === "object" && "cause" in error
        ? String((error as { cause?: unknown }).cause)
        : undefined;

    return NextResponse.json(
      {
        error: message,
        code,
        cause,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 历史任务列表暂未迁移到 CloudBase，这里先返回空列表占位
    return NextResponse.json({ tasks: [] });
  } catch (error: unknown) {
    console.error("Get tasks API error:", error);
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: string }).message)
        : "Internal server error";
    const code =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string | number }).code)
        : undefined;
    const cause =
      error && typeof error === "object" && "cause" in error
        ? String((error as { cause?: unknown }).cause)
        : undefined;
    return NextResponse.json(
      {
        error: message,
        code,
        cause,
      },
      { status: 500 }
    );
  }
}
