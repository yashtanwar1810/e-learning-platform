import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { toast } from "sonner";
import { FileText, Trash2, Upload, Sparkles, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { apiFetch, ApiError } from "@/lib/api";

export const Route = createFileRoute("/library")({
  component: () => (
    <RequireAuth>
      <LibraryPage />
    </RequireAuth>
  ),
});

type Pdf = {
  _id?: string;
  id?: string;
  title?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  pages?: number;
  createdAt?: string;
};

const idOf = (p: Pdf) => p._id ?? p.id ?? "";
const titleOf = (p: Pdf) => p.title ?? p.originalName ?? p.filename ?? "Untitled";

function LibraryPage() {
  const [pdfs, setPdfs] = useState<Pdf[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Pdf[] | { pdfs: Pdf[] }>("/pdfs");
      const list = Array.isArray(res) ? res : res.pdfs;
      setPdfs(list ?? []);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load PDFs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a PDF file");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("pdf", file);
    fd.append("file", file);
    try {
      await apiFetch("/pdfs", { method: "POST", formData: fd });
      toast.success(`Uploaded ${file.name}`);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this PDF?")) return;
    try {
      await apiFetch(`/pdfs/${id}`, { method: "DELETE" });
      setPdfs((p) => p.filter((x) => idOf(x) !== id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">Upload a PDF to generate summaries, flashcards, and quizzes.</p>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-8 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            dragOver ? "border-primary bg-accent/40" : "border-border bg-card"
          }`}
        >
          <span
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-primary-foreground shadow-glow"
            style={{ background: "var(--gradient-primary)" }}
          >
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
          </span>
          <h3 className="mt-4 text-lg font-semibold">{uploading ? "Uploading…" : "Drop a PDF here"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">or click to browse — max 25MB</p>
          <Button variant="hero" className="mt-5" disabled={uploading} onClick={() => fileRef.current?.click()}>
            Choose PDF
          </Button>
          <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={onPick} />
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold">Your documents</h2>
          {loading ? (
            <div className="mt-6 flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pdfs.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">No PDFs yet. Upload one to get started.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pdfs.map((p) => {
                const id = idOf(p);
                return (
                  <div key={id} className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground shadow-glow"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        <FileText className="h-5 w-5" />
                      </span>
                      <button
                        onClick={() => remove(id)}
                        className="rounded-md p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <h3 className="mt-4 line-clamp-2 font-semibold">{titleOf(p)}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.pages ? `${p.pages} pages · ` : ""}
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
                    </p>
                    <Link to="/pdf/$id" params={{ id }} className="mt-5">
                      <Button variant="secondary" className="w-full">
                        <Sparkles className="h-4 w-4" />
                        Open
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}