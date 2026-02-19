export async function GET() {
  return Response.json(
    {
      message: "Supabase/Postgres 调试接口已关闭，请改用 CloudBase 数据库相关工具进行检查。",
    },
    { status: 410 }
  );
}
