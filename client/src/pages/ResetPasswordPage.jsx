import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import { PasswordField } from "../components/Field.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";
import { api } from "../api.js";
import { validateConfirm, validatePassword } from "../utils/validators.js";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {
      password: validatePassword(password, "Mật khẩu mới"),
      confirm: validateConfirm(password, confirm),
    };
    setErrors(nextErrors);
    setServerError("");
    if (nextErrors.password || nextErrors.confirm) return;

    setSubmitting(true);
    try {
      const data = await api.post("/auth/reset-password", { token, password }, { auth: false });
      navigate("/login", { replace: true, state: { notice: data.message } });
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  // Liên kết không có token: báo lỗi và đề nghị yêu cầu liên kết mới
  if (!token) {
    return (
      <AuthLayout
        title="Liên kết không hợp lệ"
        subtitle="Liên kết đặt lại mật khẩu bị thiếu hoặc không đầy đủ."
        footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Quay lại đăng nhập</Link>}
      >
        <Link
          to="/forgot-password"
          className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-brand-700"
        >
          Yêu cầu liên kết mới
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Chọn mật khẩu mới cho tài khoản của bạn. Liên kết chỉ dùng được một lần."
      footer={<Link to="/login" className="font-semibold text-brand-600 hover:underline">Quay lại đăng nhập</Link>}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && (
          <Alert type="error">
            {serverError}{" "}
            {/* Token sai hoặc hết hạn: gợi ý xin liên kết mới */}
            {serverError.includes("liên kết") && (
              <Link to="/forgot-password" className="font-semibold underline">
                Yêu cầu liên kết mới
              </Link>
            )}
          </Alert>
        )}

        <div>
          <PasswordField
            label="Mật khẩu mới"
            placeholder="Ít nhất 6 ký tự"
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <PasswordStrength value={password} />
        </div>
        <PasswordField
          label="Nhập lại mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />

        <Button type="submit" full loading={submitting}>
          {submitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
        </Button>
      </form>
    </AuthLayout>
  );
}
