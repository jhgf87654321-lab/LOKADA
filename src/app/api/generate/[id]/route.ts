import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { generationTasks } from "@/db/schema/generation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

const KIE_AI_API_URL = "https://api.kie.ai/api/v1/jobs/recordInfo";
const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: taskId } = await params;

    // Get task from database
    const task = await db.query.generationTasks.findFirst({
      where: eq(generationTasks.id, taskId),
    });

    if (!task || task.userId !== session.user.id) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If task is already completed or failed, return directly
    if (task.status === "completed" || task.status === "failed") {
      return NextResponse.json({
        task: {
          id: task.id,
          status: task.status,
          prompt: task.prompt,
          originalImageUrl: task.originalImageUrl,
          generatedImageUrl: task.generatedImageUrl,
          failCode: task.failCode,
          failMessage: task.failMessage,
          createdAt: task.createdAt,
          completedAt: task.completedAt,
        },
      });
    }

    // If task has Kie.ai taskId, check status from Kie.ai
    if (task.taskId) {
      try {
        const kieResponse = await fetch(
          `${KIE_AI_API_URL}?taskId=${task.taskId}`,
          {
            headers: {
              Authorization: `Bearer ${KIE_AI_API_KEY}`,
            },
          }
        );

        if (kieResponse.ok) {
          const kieData = await kieResponse.json();
          const kieState = kieData.data?.state;

          // Update local task if status changed
          if (kieState === "success" || kieState === "fail") {
            let updateData: any = {
              status: kieState === "success" ? "completed" : "failed",
              updatedAt: new Date(),
            };

            if (kieState === "success" && kieData.data?.resultJson) {
              try {
                const result = JSON.parse(kieData.data.resultJson);
                updateData.generatedImageUrl = result.resultUrls?.[0] || null;
                updateData.completedAt = new Date(kieData.data.completeTime || Date.now());
              } catch (e) {
                console.error("Failed to parse resultJson:", e);
              }
            } else if (kieState === "fail") {
              updateData.failCode = kieData.data?.failCode;
              updateData.failMessage = kieData.data?.failMsg;
              updateData.completedAt = new Date();
            }

            await db
              .update(generationTasks)
              .set(updateData)
              .where(eq(generationTasks.id, task.id));

            // Fetch updated task
            const updatedTask = await db.query.generationTasks.findFirst({
              where: eq(generationTasks.id, taskId),
            });

            return NextResponse.json({
              task: {
                id: updatedTask?.id,
                status: updatedTask?.status,
                prompt: updatedTask?.prompt,
                originalImageUrl: updatedTask?.originalImageUrl,
                generatedImageUrl: updatedTask?.generatedImageUrl,
                failCode: updatedTask?.failCode,
                failMessage: updatedTask?.failMessage,
                createdAt: updatedTask?.createdAt,
                completedAt: updatedTask?.completedAt,
              },
            });
          }
        }
      } catch (kieError) {
        console.error("Kie.ai status check error:", kieError);
      }
    }

    // Return current task status
    return NextResponse.json({
      task: {
        id: task.id,
        status: task.status,
        prompt: task.prompt,
        originalImageUrl: task.originalImageUrl,
        createdAt: task.createdAt,
      },
    });
  } catch (error) {
    console.error("Status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
