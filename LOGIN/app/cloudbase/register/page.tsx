import CloudbaseRegisterForm from "./form";

/**
 * CloudBase 极简注册页面
 */
export default function RegisterPage() {
  return (
    <div className="cloudbase-auth-page">
      <div className="cloudbase-auth-container">
        <h1>注册</h1>
        <CloudbaseRegisterForm />
        <div className="cloudbase-auth-links">
          <a href="/cloudbase/login">已有账号？登录</a>
        </div>
      </div>
    </div>
  );
}
