import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import { TextField } from "../components/Field.jsx";
import { ArrowLeftIcon, MailIcon } from "../components/Icons.jsx";
import { api } from "../api.js";
import { validateEmail } from "../utils/validators.js";

// Đổi liên kết tuyệt đối của backend thành đường dẫn nội bộ để dùng với <Link>
function toLocalPath(link) {
  try {
    const url = new URL(link);
    return `${url.pathname}${url.search}`;
  } catch {
    return link;
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { message, devResetLink? }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    setError(emailError);
    setServerError("");
    if (emailError) return;

    setSubmitting(true);
    try {
      const data = await api.post("/auth/forgot-password", { email: email.trim() }, { auth: false });
      setResult(data);
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const backLink = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700 hover:underline">
      <ArrowLeftIcon className="h-4 w-4" /> Quay lại đăng nhập
    </Link>
  );

  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Nhập email đã đăng ký, chúng tôi sẽ tạo liên kết để bạn đặt lại mật khẩu."
      footer={backLink}
    >
      {result ? (
        <div className="space-y-4">
          <Alert type="success">{result.message}</Alert>

          {/* Chỉ xuất hiện khi backend chạy ở chế độ dev (chưa gửi email thật) */}
          {result.devResetLink && (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Chế độ dev</p>
              <p className="mt-1 text-sm text-amber-900">Chưa gửi email thật. Bấm vào liên kết dưới đây để đặt lại mật khẩu:</p>
              <Link
                to={toLocalPath(result.devResetLink)}
                className="mt-2 block break-all text-sm font-semibold text-brand-700 underline hover:text-brand-800"
              >
                {result.devResetLink}
              </Link>
            </div>
          )}

          <Button variant="secondary" full onClick={() => setResult(null)}>
            Nhập email khác
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
            error={error}
          />
          <Button type="submit" full loading={submitting}>
            {submitting ? "Đang gửi..." : "Gửi liên kết đặt lại"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
