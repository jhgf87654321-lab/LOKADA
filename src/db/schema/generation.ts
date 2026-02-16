import { boolean, integer, pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

// Generation task status enum
export const GenerationStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

// Generation tasks table
export const generationTasks = pgTable("generation_tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),

  // Kie.ai task ID
  taskId: text("task_id"),

  // Task status
  status: text("status").notNull().default('pending'),

  // Prompt and parameters
  prompt: text("prompt"),
  aspectRatio: text("aspect_ratio"),
  resolution: text("resolution"),
  outputFormat: text("output_format"),

  // Original image URL (if provided by user)
  originalImageUrl: text("original_image_url"),

  // Generated image URL (from Kie.ai)
  generatedImageUrl: text("generated_image_url"),

  // Points deducted
  pointsDeducted: integer("points_deducted").default(0),

  // Error information (if failed)
  failCode: text("fail_code"),
  failMessage: text("fail_message"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  completedAt: timestamp("completed_at"),
}, (table) => {
  return {
    userIdIdx: (table as any).userId?.index,
  };
});

export type GenerationTask = typeof generationTasks.$inferSelect;
export type NewGenerationTask = typeof generationTasks.$inferInsert;
