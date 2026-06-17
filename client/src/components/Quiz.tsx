import { useMemo, useState } from "react";
import { Check, X, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuizQuestion = {
  question: string;
  options: string[];
  answerIndex?: number;
  answer?: string;
  correctIndex?: number;
  correctAnswer?: string;
  explanation?: string;
};

function correctIndexFor(q: QuizQuestion): number {
  if (typeof q.answerIndex === "number") return q.answerIndex;
  if (typeof q.correctIndex === "number") return q.correctIndex;
  const match = (q.answer ?? q.correctAnswer ?? "").trim();
  const idx = q.options.findIndex((o) => o.trim() === match);
  return idx >= 0 ? idx : 0;
}

export function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    if (!submitted) return 0;
    return questions.reduce((acc, q, i) => (answers[i] === correctIndexFor(q) ? acc + 1 : acc), 0);
  }, [submitted, answers, questions]);

  if (questions.length === 0) return <p className="text-sm text-muted-foreground">No quiz generated.</p>;

  const reset = () => {
    setAnswers({});
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {submitted && (
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">Your score</p>
          <p className="mt-1 text-3xl font-bold">
            {score} / {questions.length}
          </p>
          <Button variant="secondary" className="mt-4" onClick={reset}>
            <RotateCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      )}
      {questions.map((q, qi) => {
        const correct = correctIndexFor(q);
        return (
          <div key={qi} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="font-medium">
              {qi + 1}. {q.question}
            </p>
            <div className="mt-4 grid gap-2">
              {q.options.map((opt, oi) => {
                const picked = answers[qi] === oi;
                const isCorrect = submitted && oi === correct;
                const isWrong = submitted && picked && oi !== correct;
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={submitted}
                    onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                      isCorrect
                        ? "border-[var(--success)] bg-[var(--success)]/10"
                        : isWrong
                          ? "border-destructive bg-destructive/10"
                          : picked
                            ? "border-primary bg-accent/40"
                            : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <span>{opt}</span>
                    {isCorrect && <Check className="h-4 w-4 text-[var(--success)]" />}
                    {isWrong && <X className="h-4 w-4 text-destructive" />}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {!submitted && (
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          disabled={Object.keys(answers).length !== questions.length}
          onClick={() => setSubmitted(true)}
        >
          Submit answers
        </Button>
      )}
    </div>
  );
}