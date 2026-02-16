import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const user = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  username: text("username"),
  display_username: text("display_username"),
  role: text("role").default("user"),
  gender: boolean("gender"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type UserType = typeof user.$inferSelect;
