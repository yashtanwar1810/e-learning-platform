import { Brain, FileText, Sparkles, Layers, GraduationCap, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero.jpg";
import { Link } from "@/lib/router";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 opacity-[0.08]" style={{ background: "var(--gradient-hero)" }} />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Powered by Google Gemini
              </span>
              <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Turn any PDF into a{" "}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  study session
                </span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                Upload lecture notes, papers, or textbooks. Lumen instantly generates summaries, flashcards, and quizzes
                so you learn faster and remember longer.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/register">
                  <Button variant="hero" size="xl">
                    Start learning free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="xl">
                    Sign in
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl opacity-40 blur-2xl" style={{ background: "var(--gradient-primary)" }} />
              <img
                src={heroImg}
                alt="Open book transforming into AI flashcards"
                width={1536}
                height={1024}
                className="relative rounded-2xl border border-border shadow-glow"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to study smarter</h2>
            <p className="mt-4 text-muted-foreground">Three AI-powered modes designed around how you actually learn.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { icon: FileText, title: "Smart summaries", desc: "Distill 50-page PDFs into the key points in seconds." },
              { icon: Layers, title: "Auto flashcards", desc: "Concept-by-concept flashcards generated from your material." },
              { icon: GraduationCap, title: "Adaptive quizzes", desc: "Test yourself with multiple-choice quizzes and track scores." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-primary-foreground shadow-glow" style={{ background: "var(--gradient-primary)" }}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl px-8 py-16 text-center text-primary-foreground shadow-glow" style={{ background: "var(--gradient-hero)" }}>
            <Brain className="mx-auto h-12 w-12 opacity-90" />
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Your next study session starts here</h2>
            <p className="mx-auto mt-3 max-w-xl text-base opacity-90">Sign up free and upload your first PDF in under a minute.</p>
            <Link to="/register" className="mt-8 inline-block">
              <Button size="xl" className="bg-background text-foreground hover:bg-background/90">
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-8">
        <p className="text-center text-sm text-muted-foreground">© {new Date().getFullYear()} Lumen. Powered by your Express + Gemini backend.</p>
      </footer>
    </div>
  );
}
