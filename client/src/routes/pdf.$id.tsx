import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ArrowLeft, FileText, Loader2, RefreshCw } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch, ApiError } from "@/lib/api";
import { Flashcards, type Flashcard } from "@/components/Flashcards";
import { Quiz, type QuizQuestion } from "@/components/Quiz";

export const Route = createFileRoute("/pdf/$id")({
  component: () => (
    <RequireAuth>
      <PdfDetail />
    </RequireAuth>
  ),
});

type Pdf = {
  _id?: string;
  id?: string;
  title?: string;
  originalName?: string;
  filename?: string;
  pages?: number;
};

function unwrap<T>(res: unknown, key: string): T {
  if (res && typeof res === "object" && key in res) {
    return (res as Record<string, T>)[key];
  }
  return res as T;
}

function PdfDetail() {
  const { id } = Route.useParams();
  const [pdf, setPdf] = useState<Pdf | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setSummary(null);
    setCards(null);
    setQuiz(null);
    apiFetch<Pdf | { pdf: Pdf }>(`/pdfs/${id}`)
      .then((r) => setPdf(unwrap<Pdf>(r, "pdf")))
      .catch((e) => toast.error(e instanceof ApiError ? e.message : "Failed to load PDF"));
  }, [id]);

  const loadSummary = async (force = false) => {
    setLoading((l) => ({ ...l, summary: true }));
    try {
      const path = force ? `/pdfs/${id}/summary?force=1` : `/pdfs/${id}/summary`;
      const res = await apiFetch<unknown>(path);
      setSummary(unwrap<string>(res, "summary"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load summary");
    } finally {
      setLoading((l) => ({ ...l, summary: false }));
    }
  };

  const loadFlashcards = async (force = false) => {
    setLoading((l) => ({ ...l, flashcards: true }));
    try {
      const path = force ? `/pdfs/${id}/flashcards?force=1` : `/pdfs/${id}/flashcards`;
      const res = await apiFetch<unknown>(path);
      setCards(unwrap<Flashcard[]>(res, "flashcards"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load flashcards");
    } finally {
      setLoading((l) => ({ ...l, flashcards: false }));
    }
  };

  const loadQuiz = async (force = false) => {
    setLoading((l) => ({ ...l, quiz: true }));
    try {
      const path = force ? `/pdfs/${id}/quiz?force=1` : `/pdfs/${id}/quiz`;
      const res = await apiFetch<unknown>(path);
      setQuiz(unwrap<QuizQuestion[]>(res, "quiz"));
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to load quiz");
    } finally {
      setLoading((l) => ({ ...l, quiz: false }));
    }
  };

  useEffect(() => {
    loadSummary();
  }, [id]);

  const title = pdf?.title ?? pdf?.originalName ?? pdf?.filename ?? "Document";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <Link to="/library" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to library
        </Link>

        <div className="mt-6 flex items-start gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground shadow-glow"
            style={{ background: "var(--gradient-primary)" }}
          >
            <FileText className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            {pdf?.pages && <p className="mt-1 text-sm text-muted-foreground">{pdf.pages} pages</p>}
          </div>
        </div>

        <Tabs
          defaultValue="summary"
          className="mt-8"
          onValueChange={(v) => {
            if (v === "summary" && summary == null) loadSummary();
            if (v === "flashcards" && cards == null) loadFlashcards();
            if (v === "quiz" && quiz == null) loadQuiz();
          }}
        >
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="flashcards">Flashcards</TabsTrigger>
            <TabsTrigger value="quiz">Quiz</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-6">
            <SectionPanel loading={loading.summary} loaded={summary != null} onGenerate={loadSummary} label="summary">
              {summary && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
                  <Button variant="ghost" size="sm" className="mt-4" onClick={() => loadSummary(true)} disabled={loading.summary}>
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
              )}
            </SectionPanel>
          </TabsContent>

          <TabsContent value="flashcards" className="mt-6">
            <SectionPanel loading={loading.flashcards} loaded={cards != null} onGenerate={loadFlashcards} label="flashcards">
              {cards && (
                <>
                  <Flashcards cards={cards} />
                  <div className="mt-4 text-center">
                    <Button variant="ghost" size="sm" onClick={() => loadFlashcards(true)} disabled={loading.flashcards}>
                      <RefreshCw className="h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                </>
              )}
            </SectionPanel>
          </TabsContent>

          <TabsContent value="quiz" className="mt-6">
            <SectionPanel loading={loading.quiz} loaded={quiz != null} onGenerate={loadQuiz} label="quiz">
              {quiz && (
                <>
                  <Quiz questions={quiz} />
                  <div className="mt-4 text-center">
                    <Button variant="ghost" size="sm" onClick={() => loadQuiz(true)} disabled={loading.quiz}>
                      <RefreshCw className="h-4 w-4" />
                      Regenerate quiz
                    </Button>
                  </div>
                </>
              )}
            </SectionPanel>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function SectionPanel({
  loading,
  loaded,
  onGenerate,
  label,
  children,
}: {
  loading?: boolean;
  loaded: boolean;
  onGenerate: () => void;
  label: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-3 text-sm text-muted-foreground">Generating {label}…</span>
      </div>
    );
  }
  if (!loaded) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">No {label} generated yet.</p>
        <Button variant="hero" className="mt-4" onClick={onGenerate}>
          Generate {label}
        </Button>
      </div>
    );
  }
  return <>{children}</>;
}