/**
 * 测试页面 - 验证路由是否正常工作
 */
export default function TestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">CloudBase 路由测试</h1>
        <p className="mt-4 text-muted-foreground">
          如果你能看到这个页面，说明路由正常工作
        </p>
        <div className="mt-8 space-y-2">
          <a
            href="/auth/cloudbase/login"
            className="block text-primary hover:underline"
          >
            → 登录页面
          </a>
          <a
            href="/auth/cloudbase/register"
            className="block text-primary hover:underline"
          >
            → 注册页面
          </a>
        </div>
      </div>
    </div>
  );
}
