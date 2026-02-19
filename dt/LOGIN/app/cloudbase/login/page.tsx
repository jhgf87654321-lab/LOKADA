import CloudbaseLoginForm from "./form";

/**
 * CloudBase 极简登录页面
 */
export default function LoginPage() {
  return (
    <div className="cloudbase-auth-page">
      <div className="cloudbase-auth-container">
        <h1>登录</h1>
        <CloudbaseLoginForm />
        <div className="cloudbase-auth-links">
          <a href="/cloudbase/register">注册账号</a>
        </div>
      </div>
    </div>
  );
}
