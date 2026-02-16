import postgres from "postgres";

async function testConnection() {
  const DATABASE_URL = "postgresql://postgres:LOKADA63050563@db.gtfmcjjwdmteeftjfbtu.supabase.co:5432/postgres";
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
