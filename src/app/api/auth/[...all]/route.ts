import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, context: { params: Promise<{ all: string[] }> }) {
  return NextResponse.json(
    {
      error: "better-auth 已下线，认证已切换到 CloudBase，请使用 /cloudbase/login 与 /cloudbase/register。",
    },
    { status: 410 }
  );
}

export async function POST(req: NextRequest, context: { params: Promise<{ all: string[] }> }) {
  return NextResponse.json(
    {
      error: "better-auth 已下线，认证已切换到 CloudBase，请使用 /cloudbase/login 与 /cloudbase/register。",
    },
    { status: 410 }
  );
}
