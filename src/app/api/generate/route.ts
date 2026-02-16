import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { generationTasks } from "@/db/schema/generation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { headers } from "next/headers";

const KIE_AI_API_URL = "https://api.kie.ai/api/v1/jobs/createTask";
const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY!;
const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// Points cost per generation
const GENERATION_COST = 10;

// Generate UUID without external library
function generateId(): string {
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    console.log("API Headers:", headersList.get('cookie'));

    const session = await auth.api.getSession({ headers: headersList });
    console.log("Session:", session);

    if (!session?.user) {
      console.log("No session found, returning 401");
      return NextResponse.json({ error: "Unauthorized - Please login first" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();

    const {
      prompt,
      originalImageUrl,
      aspectRatio = "1:1",
      resolution = "1K",
      outputFormat = "png"
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Create task in database
    const taskId = generateId();

    // Prepare image_input if original image is provided
    const imageInput = originalImageUrl ? [originalImageUrl] : [];

    // Call Kie.ai API to create task
    const kieResponse = await fetch(KIE_AI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KIE_AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nano-banana-pro",
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

    const kieTaskId = kieData.data?.taskId;

    if (!kieTaskId) {
      return NextResponse.json(
        { error: "Invalid response from Kie.ai API" },
        { status: 500 }
      );
    }

    // Save task to database
    await db.insert(generationTasks).values({
      id: taskId,
      userId,
      taskId: kieTaskId,
      status: "processing",
      prompt,
      aspectRatio,
      resolution,
      outputFormat,
      originalImageUrl: originalImageUrl || null,
      pointsDeducted: GENERATION_COST,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      taskId,
      kieTaskId,
      message: "Generation task created successfully",
    });
  } catch (error) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized - Please login first" }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const taskId = searchParams.get("taskId");

    if (taskId) {
      // Get specific task
      const task = await db.query.generationTasks.findFirst({
        where: eq(generationTasks.id, taskId),
      });

      if (!task || task.userId !== userId) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      return NextResponse.json({ task });
    }

    // Get all tasks for user
    const tasks = await db.query.generationTasks.findMany({
      where: eq(generationTasks.userId, userId),
      orderBy: [desc(generationTasks.createdAt)],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Get tasks API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
