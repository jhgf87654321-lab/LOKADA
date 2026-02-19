import { NextRequest, NextResponse } from "next/server";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Kie.ai callback data structure
    const { taskId, state, resultJson, failCode, failMsg, completeTime } = body.data || {};

    if (!taskId) {
      console.error("Callback: No taskId provided");
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      );
    }

    // 目前不再持久化到本地数据库，仅记录日志并返回成功
    console.log("Callback received:", {
      taskId,
      state,
      hasResultJson: Boolean(resultJson),
      failCode,
      failMsg,
      completeTime,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Callback API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({
    message: "Kie.ai callback endpoint",
    status: "OK",
    timestamp: new Date().toISOString(),
  });
}
