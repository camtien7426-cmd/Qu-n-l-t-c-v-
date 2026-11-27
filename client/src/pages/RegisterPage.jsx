import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout.jsx";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import { PasswordField, TextField } from "../components/Field.jsx";
import { MailIcon, UserIcon } from "../components/Icons.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { validateConfirm, validateEmail, validateName, validatePassword } from "../utils/validators.js";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: validateConfirm(form.password, form.confirm),
    };
    setErrors(nextErrors);
    setServerError("");
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitting(true);
    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate("/", { replace: true }); // đăng ký xong tự đăng nhập
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Chỉ mất một phút để bắt đầu làm việc nhóm hiệu quả hơn."
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 hover:underline">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && <Alert type="error">{serverError}</Alert>}

        <TextField
          label="Họ và tên"
          icon={UserIcon}
          placeholder="Nguyễn Văn A"
          autoComplete="name"
          autoFocus
          value={form.name}
          onChange={setField("name")}
          error={errors.name}
        />
        <TextField
          label="Email"
          type="email"
          icon={MailIcon}
          placeholder="ten@gmail.com"
          autoComplete="email"
          value={form.email}
          onChange={setField("email")}
          error={errors.email}
        />
        <div>
          <PasswordField
            label="Mật khẩu"
            placeholder="Ít nhất 6 ký tự"
            autoComplete="new-password"
            value={form.password}
            onChange={setField("password")}
            error={errors.password}
          />
          <PasswordStrength value={form.password} />
        </div>
        <PasswordField
          label="Nhập lại mật khẩu"
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
          value={form.confirm}
          onChange={setField("confirm")}
          error={errors.confirm}
        />

        <Button type="submit" full loading={submitting}>
          {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
        </Button>
      </form>
    </AuthLayout>
  );
}
