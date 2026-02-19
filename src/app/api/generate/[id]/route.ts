import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

const KIE_AI_API_URL = "https://api.kie.ai/api/v1/jobs/recordInfo";
const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    // 直接通过 Kie.ai 查询任务状态，不再依赖本地数据库
    try {
      const kieResponse = await fetch(
        `${KIE_AI_API_URL}?taskId=${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${KIE_AI_API_KEY}`,
          },
        }
      );

      if (!kieResponse.ok) {
        const text = await kieResponse.text();
        console.error("Kie.ai status error:", kieResponse.status, text);
        return NextResponse.json(
          { error: "Failed to query generation task status" },
          { status: kieResponse.status }
        );
      }

      const kieData = await kieResponse.json();
      const state = kieData.data?.state as string | undefined;
      const resultJson = kieData.data?.resultJson as string | undefined;

      let status: "processing" | "completed" | "failed" = "processing";
      let generatedImageUrl: string | null = null;
      let failCode: string | undefined;
      let failMessage: string | undefined;
      let completedAt: Date | undefined;

      if (state === "success") {
        status = "completed";
        if (resultJson) {
          try {
            const parsed = JSON.parse(resultJson);
            generatedImageUrl = parsed.resultUrls?.[0] || null;
          } catch (e) {
            console.error("Failed to parse resultJson:", e);
          }
        }
        if (kieData.data?.completeTime) {
          completedAt = new Date(kieData.data.completeTime);
        }
      } else if (state === "fail") {
        status = "failed";
        failCode = kieData.data?.failCode;
        failMessage = kieData.data?.failMsg;
        completedAt = new Date();
      }

      return NextResponse.json({
        task: {
          id: taskId,
          status,
          generatedImageUrl,
          failCode,
          failMessage,
          createdAt: new Date(kieData.data?.createTime || Date.now()),
          completedAt: completedAt ?? null,
        },
      });
    } catch (error) {
      console.error("Status API error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Status API outer error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
