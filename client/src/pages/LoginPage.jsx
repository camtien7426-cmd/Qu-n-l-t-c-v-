import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import { PasswordField, TextField } from "../components/Field.jsx";
import { MailIcon } from "../components/Icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { validateEmail } from "../utils/validators.js";

export default function LoginPage() {
  const { login, expired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Thông báo từ trang trước (ví dụ vừa đặt lại mật khẩu xong)
  const notice = location.state?.notice;
  // Sau khi đăng nhập quay lại trang người dùng đang muốn vào
  const redirectTo = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {
      email: validateEmail(email),
      password: password ? "" : "Hãy nhập mật khẩu",
    };
    setErrors(nextErrors);
    setServerError("");
    if (nextErrors.email || nextErrors.password) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Chào mừng trở lại"
      subtitle="Đăng nhập để tiếp tục quản lý công việc của nhóm bạn."
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {notice && <Alert type="success">{notice}</Alert>}
        {expired && !serverError && <Alert type="warning">Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại nhé!</Alert>}
        {serverError && <Alert type="error">{serverError}</Alert>}

        <TextField
          label="Email"
          type="email"
          icon={MailIcon}
          placeholder="ten@gmail.com"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div>
          <PasswordField
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700 hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
        </div>

        <Button type="submit" full loading={submitting}>
          {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </Button>
      </form>
    </AuthLayout>
  );
}
