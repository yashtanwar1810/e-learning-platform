import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Flashcard = { question: string; answer: string };

export function Flashcards({ cards: input }: { cards: Flashcard[] }) {
  const [cards, setCards] = useState(input);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setCards(input);
    setI(0);
    setFlipped(false);
  }, [input]);

  if (cards.length === 0) return <p className="text-sm text-muted-foreground">No flashcards generated.</p>;

  const card = cards[i];
  const go = (delta: number) => {
    setFlipped(false);
    setI((p) => (p + delta + cards.length) % cards.length);
  };
  const shuffle = () => {
    setCards((c) => [...c].sort(() => Math.random() - 0.5));
    setI(0);
    setFlipped(false);
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm text-muted-foreground">
        Card {i + 1} of {cards.length}
      </p>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="mt-4 flex h-72 w-full max-w-2xl flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-md transition-all hover:shadow-glow"
      >
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {flipped ? "Answer" : "Question"}
        </span>
        <p className="mt-4 text-xl font-medium leading-relaxed">{flipped ? card.answer : card.question}</p>
        <span className="mt-6 text-xs text-muted-foreground">Click to flip</span>
      </button>
      <div className="mt-6 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="secondary" onClick={() => setFlipped((f) => !f)}>
          <RotateCw className="h-4 w-4" />
          Flip
        </Button>
        <Button variant="secondary" onClick={shuffle}>
          <Shuffle className="h-4 w-4" />
          Shuffle
        </Button>
        <Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Next">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}