import postgres from "postgres";

async function testConnection() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error("DATABASE_URL is not set. Please configure your CloudBase 数据库连接字符串。");
    process.exit(1);
  }

  console.log("Testing connection to:", DATABASE_URL.replace(/:[^:@]+@/, ":****@"));

  try {
    const sql = postgres(DATABASE_URL, {
      prepare: false,
      ssl: "require",
    });

    console.log("Connection object created, testing query...");

    const result = await sql`SELECT current_user, current_database()`;
    console.log("SUCCESS! Result:", result);

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error("CONNECTION ERROR:");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

testConnection();
