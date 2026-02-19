/**
 * 最简单的测试页面 - 不依赖任何组件
 */
export default function SimpleTestPage() {
  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}>
        简单测试页面
      </h1>
      <p style={{ marginBottom: "2rem" }}>
        如果你能看到这个页面，说明路由正常工作
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
        <a href="/auth/cloudbase/login" style={{ color: "blue", textDecoration: "underline" }}>
          登录页面
        </a>
        <a href="/auth/cloudbase/register" style={{ color: "blue", textDecoration: "underline" }}>
          注册页面
        </a>
        <a href="/auth" style={{ color: "blue", textDecoration: "underline" }}>
          返回 /auth
        </a>
      </div>
    </div>
  );
}
