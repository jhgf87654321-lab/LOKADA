import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { generationTasks } from "@/db/schema/generation";
import { eq } from "drizzle-orm";

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

    // Find the task by Kie.ai task ID
    const existingTask = await db.query.generationTasks.findFirst({
      where: eq(generationTasks.taskId, taskId),
    });

    if (!existingTask) {
      console.error(`Callback: Task not found for taskId: ${taskId}`);
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Parse result if available
    let generatedImageUrl = null;
    if (resultJson) {
      try {
        const result = JSON.parse(resultJson);
        generatedImageUrl = result.resultUrls?.[0] || null;
      } catch (e) {
        console.error("Failed to parse resultJson:", e);
      }
    }

    // Update task with results
    const updateData: any = {
      status: state === "success" ? "completed" : state === "fail" ? "failed" : "processing",
      updatedAt: new Date(),
    };

    if (state === "success" && generatedImageUrl) {
      updateData.generatedImageUrl = generatedImageUrl;
      updateData.completedAt = new Date(completeTime || Date.now());
    } else if (state === "fail") {
      updateData.failCode = failCode;
      updateData.failMessage = failMsg;
      updateData.completedAt = new Date();
    }

    await db
      .update(generationTasks)
      .set(updateData)
      .where(eq(generationTasks.taskId, taskId));

    console.log(`Callback: Task ${taskId} updated with status: ${state}`);

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
