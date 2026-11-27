import { useEffect, useRef, useState } from "react";
import Alert from "../components/Alert.jsx";
import Avatar from "../components/Avatar.jsx";
import Button from "../components/Button.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { PasswordField, TextField } from "../components/Field.jsx";
import { CameraIcon, LockIcon, MailIcon, ShieldIcon, TrashIcon, UserIcon } from "../components/Icons.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { validateAvatarFile, validateConfirm, validateName, validatePassword } from "../utils/validators.js";

function SectionCard({ icon: IconComp, title, description, children }) {
  return (
    <section className="card p-6 sm:p-7">
      <div className="mb-6 flex items-start gap-3.5">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <IconComp className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/* ---------------------------- Ảnh đại diện ---------------------------- */
function AvatarSection() {
  const { user, setUser } = useAuth();
  const inputRef = useRef(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState(null); // { type, text }
  const [uploading, setUploading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Giải phóng URL xem trước khi đổi ảnh hoặc rời trang
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const clearPending = () => {
    setPendingFile(null);
    setPreview("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const problem = validateAvatarFile(file);
    if (problem) {
      clearPending();
      setMessage({ type: "error", text: problem });
      return;
    }
    setMessage(null);
    setPendingFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    const form = new FormData();
    form.append("avatar", pendingFile);
    setUploading(true);
    setMessage(null);
    try {
      const data = await api.upload("/auth/avatar", form);
      setUser(data.user);
      clearPending();
      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const data = await api.delete("/auth/avatar");
      setUser(data.user);
      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setRemoving(false);
      setConfirmOpen(false);
    }
  };

  return (
    <section className="card p-6 sm:p-7">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative">
          <Avatar name={user.name} src={preview || user.avatarUrl} size="lg" className="shadow-soft" />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            aria-label="Chọn ảnh đại diện mới"
            className="absolute -bottom-1 -right-1 inline-flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-brand-600 text-white shadow-md transition hover:bg-brand-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/40"
          >
            <CameraIcon className="h-4 w-4" />
          </button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePick} />
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900">{user.name}</h1>
          <p className="truncate text-slate-500">{user.email}</p>
          <p className="mt-1 text-xs text-slate-400">
            Thành viên từ {new Date(user.createdAt).toLocaleDateString("vi-VN")}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
            {pendingFile ? (
              <>
                <Button onClick={handleUpload} loading={uploading}>
                  {uploading ? "Đang tải lên..." : "Lưu ảnh này"}
                </Button>
                <Button variant="secondary" onClick={clearPending} disabled={uploading}>
                  Hủy
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => inputRef.current?.click()}>
                  <CameraIcon className="h-4 w-4" /> {user.avatarUrl ? "Đổi ảnh" : "Tải ảnh lên"}
                </Button>
                {user.avatarUrl && (
                  <Button variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => setConfirmOpen(true)}>
                    <TrashIcon className="h-4 w-4" /> Xóa ảnh
                  </Button>
                )}
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">Ảnh JPG, PNG hoặc WebP, tối đa 2 MB.</p>
        </div>
      </div>

      {message && <Alert type={message.type} className="mt-5">{message.text}</Alert>}

      <ConfirmDialog
        open={confirmOpen}
        title="Xóa ảnh đại diện?"
        message="Ảnh hiện tại sẽ bị xóa và thay bằng chữ cái đầu của tên bạn."
        confirmText="Xóa ảnh"
        loading={removing}
        onConfirm={handleRemove}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  );
}

/* ------------------------------ Thông tin ------------------------------ */
function InfoSection() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const unchanged = name.trim().replace(/\s+/g, " ") === user.name;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validateName(name);
    setError(problem);
    setMessage(null);
    if (problem) return;

    setSaving(true);
    try {
      const data = await api.patch("/auth/me", { name: name.trim() });
      setUser(data.user);
      setName(data.user.name);
      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard icon={UserIcon} title="Thông tin cá nhân" description="Cập nhật họ tên hiển thị với các thành viên trong nhóm.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {message && <Alert type={message.type}>{message.text}</Alert>}
        <TextField label="Họ và tên" icon={UserIcon} value={name} onChange={(e) => setName(e.target.value)} error={error} autoComplete="name" />
        <TextField
          label="Email"
          icon={MailIcon}
          value={user.email}
          readOnly
          disabled
          hint="Email dùng để đăng nhập nên không thể thay đổi."
        />
        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={unchanged}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

/* ------------------------------ Mật khẩu ------------------------------ */
function PasswordSection() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nextErrors = {
      current: form.current ? "" : "Hãy nhập mật khẩu hiện tại",
      next: validatePassword(form.next, "Mật khẩu mới"),
      confirm: validateConfirm(form.next, form.confirm),
    };
    if (!nextErrors.next && form.next === form.current) nextErrors.next = "Mật khẩu mới phải khác mật khẩu hiện tại";
    setErrors(nextErrors);
    setMessage(null);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSaving(true);
    try {
      const data = await api.post("/auth/change-password", {
        currentPassword: form.current,
        newPassword: form.next,
      });
      setForm({ current: "", next: "", confirm: "" });
      setMessage({ type: "success", text: data.message });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard icon={ShieldIcon} title="Đổi mật khẩu" description="Dùng mật khẩu dài và khác với các tài khoản khác để bảo vệ dữ liệu của bạn.">
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {message && <Alert type={message.type}>{message.text}</Alert>}
        <PasswordField
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
          value={form.current}
          onChange={setField("current")}
          error={errors.current}
        />
        <div>
          <PasswordField
            label="Mật khẩu mới"
            placeholder="Ít nhất 6 ký tự"
            autoComplete="new-password"
            value={form.next}
            onChange={setField("next")}
            error={errors.next}
          />
          <PasswordStrength value={form.next} />
        </div>
        <PasswordField
          label="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          value={form.confirm}
          onChange={setField("confirm")}
          error={errors.confirm}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            <LockIcon className="h-4 w-4" /> {saving ? "Đang đổi..." : "Đổi mật khẩu"}
          </Button>
        </div>
      </form>
    </SectionCard>
  );
}

export default function ProfilePage() {
  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-6">
      <AvatarSection />
      <InfoSection />
      <PasswordSection />
    </div>
  );
}
