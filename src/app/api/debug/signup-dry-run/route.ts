export async function GET() {
  return Response.json(
    {
      error: "Supabase/Postgres 调试接口已关闭，请使用 CloudBase 数据库进行调试。",
    },
    { status: 410 }
  );
}
