import { useCallback, useEffect, useState } from "react";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import { TextField } from "../components/Field.jsx";
import { FolderIcon, PlusIcon } from "../components/Icons.jsx";
import { LoadingBlock } from "../components/Spinner.jsx";
import { api } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

// Danh sách dự án có thể đến từ API bản cũ (members + _count) hoặc bản mới (role, taskCount...)
function normalizeProject(p, userId) {
  const leader = p.members?.find((m) => m.role === "LEADER");
  const myRole = p.role || p.members?.find((m) => m.userId === userId)?.role;
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    leaderName: leader?.user?.name,
    isLeader: myRole === "LEADER",
    taskCount: p.taskCount ?? p._count?.tasks ?? 0,
    memberCount: p.memberCount ?? p.members?.length,
  };
}

function ProjectCard({ project }) {
  return (
    <article className="card group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
          <FolderIcon className="h-6 w-6" />
        </span>
        {project.isLeader && (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Trưởng nhóm</span>
        )}
      </div>
      <h3 className="mt-4 text-lg font-bold text-slate-900">{project.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">{project.description || "Chưa có mô tả"}</p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>{project.leaderName ? `Trưởng nhóm: ${project.leaderName}` : "Dự án nhóm"}</span>
        <span className="font-semibold text-slate-700">{project.taskCount} công việc</span>
      </div>
    </article>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [loadError, setLoadError] = useState("");

  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");

  const loadProjects = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await api.get("/projects");
      setProjects(Array.isArray(data) ? data.map((p) => normalizeProject(p, user.id)) : []);
      setStatus("ready");
    } catch (err) {
      setLoadError(err.message);
      setStatus("error");
    }
  }, [user.id]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Hãy nhập tên dự án");
      return;
    }
    setFormError("");
    setCreating(true);
    try {
      await api.post("/projects", { name: name.trim(), description: description.trim() || null });
      setName("");
      setDescription("");
      setShowForm(false);
      await loadProjects();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const firstName = user.name.trim().split(/\s+/).pop();

  return (
    <div className="animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-600">Xin chào, {firstName} 👋</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">Dự án của bạn</h1>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <PlusIcon className="h-4 w-4" /> {showForm ? "Đóng" : "Tạo dự án"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} noValidate className="card mt-6 grid gap-4 p-5 sm:grid-cols-2">
          {formError && <Alert type="error" className="sm:col-span-2">{formError}</Alert>}
          <TextField label="Tên dự án" placeholder="VD: Đồ án Lập trình Web" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <TextField label="Mô tả" placeholder="Mô tả ngắn (không bắt buộc)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div className="sm:col-span-2">
            <Button type="submit" loading={creating}>
              {creating ? "Đang tạo..." : "Tạo dự án"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8">
        {status === "loading" && <LoadingBlock text="Đang tải dự án..." />}

        {status === "error" && (
          <div className="mx-auto max-w-md py-10 text-center">
            <Alert type="error">{loadError}</Alert>
            <Button variant="secondary" className="mt-4" onClick={loadProjects}>
              Thử lại
            </Button>
          </div>
        )}

        {status === "ready" && projects.length === 0 && (
          <div className="card mx-auto flex max-w-lg flex-col items-center px-6 py-14 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <FolderIcon className="h-8 w-8" />
            </span>
            <h2 className="mt-5 text-xl font-bold text-slate-900">Chưa có dự án nào</h2>
            <p className="mt-1.5 text-sm text-slate-500">Tạo dự án đầu tiên để bắt đầu chia việc cho nhóm của bạn.</p>
            <Button className="mt-6" onClick={() => setShowForm(true)}>
              <PlusIcon className="h-4 w-4" /> Tạo dự án
            </Button>
          </div>
        )}

        {status === "ready" && projects.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
