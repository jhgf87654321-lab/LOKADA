/**
 * 简单的 auth 路由测试页面
 */
export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Auth 路由测试</h1>
        <p className="mt-4">如果你能看到这个页面，说明 /auth 路由正常工作</p>
        <div className="mt-8 space-y-2">
          <a href="/auth/cloudbase/test" className="block text-blue-500 hover:underline">
            → CloudBase 测试页面
          </a>
          <a href="/auth/cloudbase/login" className="block text-blue-500 hover:underline">
            → CloudBase 登录页面
          </a>
        </div>
      </div>
    </div>
  );
}
