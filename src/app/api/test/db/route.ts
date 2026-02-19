export async function GET() {
  return Response.json(
    {
      message: "Supabase/Postgres 测试接口已关闭，请使用 CloudBase 数据库。",
    },
    { status: 410 }
  );
}
