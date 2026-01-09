import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clapperboard, Sparkles, Layers, Share2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2 font-bold text-xl" href="/">
          <Clapperboard className="h-6 w-6 text-primary" />
          <span>Storyboard</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4 flex items-center" href="/login">
            Sign In
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background"></div>
          <div className="container px-4 md:px-6 relative">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                  Visual Storytelling, Simplified.
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Planning your next video masterpiece has never been easier. Write scripts, organize scenes, and storyboard your vision in one place.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/register">
                  <Button size="lg" className="h-12 px-8">
                    Start Creating <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="h-12 px-8">
                    Log In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/30 border-t">
          <div className="container px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Script to Screen</h2>
                <p className="text-muted-foreground">
                  Write your screenplay with industry-standard formatting. Seamlessly link scenes to your storyboard.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Scene Management</h2>
                <p className="text-muted-foreground">
                  Break down your script into manageble scenes and shots. Organize your production effortlessly.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center p-6 bg-background rounded-xl border shadow-sm">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Share2 className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Visual Planning</h2>
                <p className="text-muted-foreground">
                  Visualize every shot. Upload references or use placeholders to create a comprehensive storyboard.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t font-light text-xs text-muted-foreground">
        <p>© 2024 Storyboard App. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
