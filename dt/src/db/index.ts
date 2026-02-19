import * as schema from "./schema";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

// CloudBase 托管的数据库连接 URL（通过环境变量 DATABASE_URL 提供）
const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
