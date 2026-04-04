'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Eye, BarChart3, BookOpen, Brain, Shield, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

type LandingPageProps = {
  isAuthenticated?: boolean;
  userName?: string;
  onOpenDashboard?: () => void;
  onSignOut?: () => Promise<void> | void;
};

export default function LandingPage({
  isAuthenticated = false,
  userName,
  onOpenDashboard,
  onSignOut,
}: LandingPageProps) {
  const router = useRouter();
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const [trails, setTrails] = useState<Array<{ 
    id: string; 
    x: number; 
    y: number; 
    opacity: number; 
    hue: number;
    size: number;
    createdAt: number;
  }>>([]);
  const trailIndexRef = useRef(0);
  const lastTrailTimeRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroSectionRef.current) return;

      const rect = heroSectionRef.current.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;

      const now = Date.now();
      // Create trails every 30ms for smooth brush effect
      if (now - lastTrailTimeRef.current < 30) return;
      lastTrailTimeRef.current = now;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Create color-shifting hue
      const hue = (now * 0.5) % 360;
      const trailId = `trail-${trailIndexRef.current++}`;
      const size = Math.random() * 6 + 4; // Larger particles for brush effect

      setTrails((prev) => {
        const updated = [
          ...prev,
          { 
            id: trailId, 
            x, 
            y, 
            opacity: 1,
            hue,
            size,
            createdAt: now,
          },
        ];
        // Keep only last 40 trails for better brush effect
        return updated.slice(-40);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Fade out animation loop
  useEffect(() => {
    const fadeInterval = setInterval(() => {
      setTrails((prev) =>
        prev
          .map((trail) => {
            const age = Date.now() - trail.createdAt;
            const fadeDuration = 600; // Fade over 600ms
            const newOpacity = Math.max(0, 1 - age / fadeDuration);
            return { ...trail, opacity: newOpacity };
          })
          .filter((trail) => trail.opacity > 0.01)
      );
    }, 30);

    return () => clearInterval(fadeInterval);
  }, []);

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: 'Smart Document Reading',
      description: 'Intelligently parse and analyze documents with adaptive formatting for optimal readability.',
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: 'Eye Strain Reduction',
      description: 'Advanced algorithms minimize eye fatigue with optimized contrast, spacing, and lighting.',
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: 'Concept Mapping',
      description: 'Visualize relationships between ideas and build comprehensive concept graphs.',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast',
      description: 'Blazingly fast performance optimized for seamless reading experiences.',
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Analytics & Progress',
      description: 'Track your reading progress and gain insights into your learning patterns.',
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Secure & Private',
      description: 'Your documents and data are encrypted and securely stored.',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Upload Documents',
      description: 'Simply upload your documents in any format. We support PDFs, documents, and more.',
    },
    {
      number: '2',
      title: 'Intelligent Analysis',
      description: 'Our engine analyzes and optimizes your content for the best reading experience.',
    },
    {
      number: '3',
      title: 'Start Reading',
      description: 'Read with optimized formatting designed to reduce eye strain and boost comprehension.',
    },
    {
      number: '4',
      title: 'Track Growth',
      description: 'Monitor your progress, insights, and learning patterns over time.',
    },
  ];

  const handleDashboardClick = () => {
    if (onOpenDashboard) {
      onOpenDashboard();
      return;
    }

    router.push('/dashboard');
  };

  const handlePrimaryCta = () => {
    if (isAuthenticated) {
      handleDashboardClick();
      return;
    }

    router.push('/sign-in?mode=signup');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/25 bg-gradient-to-b from-slate-300/15 to-slate-200/25 backdrop-blur-xl shadow-md shadow-black/8 transition-all duration-300">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/85 to-purple-600/85 text-white flex items-center justify-center font-semibold shadow-sm shadow-purple-500/15 transition-all duration-500 group-hover:shadow-md group-hover:shadow-purple-500/25">
              <BookOpen className="w-5 h-5 transition-transform duration-500 group-hover:scale-105" />
            </div>
            <span className="text-lg font-semibold text-foreground tracking-tight transition-colors duration-500 group-hover:text-purple-500/70">Enfinity</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  onClick={handleDashboardClick} 
                  className="text-sm sm:text-base px-3 sm:px-4 transition-all duration-300 hover:bg-purple-500/8 hover:text-purple-600 focus-visible:ring-purple-500/30"
                >
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onSignOut?.()} 
                  className="text-sm sm:text-base px-3 sm:px-4 border-border/40 transition-all duration-300 hover:bg-red-500/5 hover:border-red-400/25 hover:text-red-600 focus-visible:ring-red-500/30"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/sign-in')} 
                  className="text-sm sm:text-base px-3 sm:px-4 transition-all duration-300 hover:bg-slate-200/5 hover:text-purple-600 focus-visible:ring-purple-500/30"
                >
                  Sign In
                </Button>
                <Button 
                  onClick={() => router.push('/sign-in?mode=signup')}
                  className="text-sm sm:text-base px-3 sm:px-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-650 hover:to-purple-750 text-white shadow-sm shadow-purple-500/15 transition-all duration-300 hover:shadow-md hover:shadow-purple-500/25 focus-visible:ring-purple-400/50"
                >
                  Get Started
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroSectionRef} className="relative w-full py-24 md:py-40 z-10 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Cursor Trail - Large Brush Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {trails.map((trail) => (
            <div
              key={trail.id}
              className="absolute"
              style={{
                left: `${trail.x}px`,
                top: `${trail.y}px`,
                width: '120px',
                height: '120px',
                opacity: trail.opacity,
                transform: 'translate(-50%, -50%)',
                background: `radial-gradient(ellipse 60px 40px at center, hsla(${trail.hue}, 100%, 60%, ${trail.opacity * 0.8}), hsla(${(trail.hue + 60) % 360}, 100%, 55%, ${trail.opacity * 0.4}), transparent 70%)`,
                filter: `blur(25px) drop-shadow(0 0 40px hsla(${(trail.hue + 30) % 360}, 100%, 50%, ${trail.opacity * 0.6}))`,
                transition: 'opacity 0.4s ease-out',
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>

        {/* Bubbly gradient blobs */}
        <div className="absolute inset-0">
          {/* Violet bubble - top left */}
          <div className="absolute top-0 left-0 w-[550px] h-[550px] rounded-full blur-3xl opacity-70 -translate-x-1/4 -translate-y-1/4"
               style={{ background: 'radial-gradient(circle at 30% 30%, hsl(250, 95%, 60%), transparent 65%)' }} />
          
          {/* Rose bubble - bottom right */}
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-60 translate-x-1/5 translate-y-1/5"
               style={{ background: 'radial-gradient(circle at 70% 70%, hsl(340, 90%, 55%), transparent 65%)' }} />
          
          {/* Sky bubble - top right */}
          <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-65 translate-x-1/4"
               style={{ background: 'radial-gradient(circle at 50% 50%, hsl(205, 95%, 58%), transparent 65%)' }} />
          
          {/* Accent bubble - center left */}
          <div className="absolute top-1/2 left-0 w-[350px] h-[350px] rounded-full blur-3xl opacity-55 -translate-y-1/2 -translate-x-1/4"
               style={{ background: 'radial-gradient(circle, hsl(172, 95%, 48%), transparent 65%)' }} />

          {/* Subtle overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/15 to-transparent" />
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4 text-purple-300" />
                <span className="text-white/95">Adaptive reading, redesigned</span>
              </div>
            </div>
            <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight bg-gradient-to-r from-white via-purple-200 to-purple-300 bg-clip-text text-transparent">
                {isAuthenticated ? 'Resume Your Reading Flow' : 'Read Smarter, Learn Faster'}
              </h1>
              <p className="text-lg md:text-2xl text-white/85 max-w-3xl mx-auto leading-relaxed">
                {isAuthenticated
                  ? 'Pick up where you left off in your dashboard, with your documents, folders, and reading sessions ready to go.'
                  : 'Enfinity transforms how you read and learn. Intelligent analysis, eye-strain protection, and concept mapping in one focused workspace.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Button
                size="lg"
                onClick={handlePrimaryCta}
                className="gap-2 bg-gradient-to-r from-cyan-600 via-purple-600 to-pink-600 hover:from-cyan-700 hover:via-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50"
              >
                {isAuthenticated ? 'Open Dashboard' : 'Start Reading Free'}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  if (isAuthenticated) {
                    onSignOut?.();
                    return;
                  }

                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="border-white/40 bg-white/15 text-white hover:bg-white/25"
              >
                {isAuthenticated ? 'Sign Out' : 'Learn More'}
              </Button>
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
              {(isAuthenticated
                ? ['Dashboard Ready', 'Saved Sessions', 'Personalized Reading']
                : ['Zero-Chrome Reading', 'Adaptive Text', 'Eye-Strain Protection']
              ).map((item) => (
                <span key={item} className="px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/30 text-xs font-medium text-white/90">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 relative z-10">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to read smarter and learn faster.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="glass-card p-6 hover:-translate-y-1 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl gradient-violet text-primary-foreground mb-4 shadow-md shadow-primary/20">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 relative z-10">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">
              Get started in 4 simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-violet text-primary-foreground font-bold text-lg shadow-md shadow-primary/20">
                    {step.number}
                  </div>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-8 h-0.5 bg-gradient-to-r from-primary/70 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 relative z-10">
        <div className="container">
          <div className="mx-auto max-w-4xl relative rounded-3xl overflow-hidden">
            {/* Background gradient blobs for CTA */}
            <div className="absolute inset-0 -z-10">
              {/* Violet glow - top left */}
              <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-70"
                   style={{ background: 'radial-gradient(circle, hsl(270, 100%, 60%), transparent 65%)' }} />
              
              {/* Cyan glow - top right */}
              <div className="absolute -top-20 -right-40 w-96 h-96 rounded-full blur-3xl opacity-70"
                   style={{ background: 'radial-gradient(circle, hsl(180, 100%, 50%), transparent 65%)' }} />
              
              {/* Pink/Magenta glow - bottom left */}
              <div className="absolute -bottom-32 -left-40 w-80 h-80 rounded-full blur-3xl opacity-60"
                   style={{ background: 'radial-gradient(circle, hsl(320, 100%, 55%), transparent 65%)' }} />
              
              {/* Orange/Yellow glow - bottom right */}
              <div className="absolute -bottom-20 -right-32 w-96 h-96 rounded-full blur-3xl opacity-65"
                   style={{ background: 'radial-gradient(circle, hsl(45, 100%, 55%), transparent 65%)' }} />
              
              {/* Background base with colorful gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-cyan-950" />
            </div>

            <div className="relative p-10 md:p-16 text-center">
              {/* Colorful accent bars */}
              <div className="absolute top-0 left-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform -translate-x-1/2" />
              <div className="absolute bottom-0 left-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent transform -translate-x-1/2" />
              
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Ready to Transform Your Reading?
              </h2>
              
              <p className="text-lg md:text-xl bg-gradient-to-r from-orange-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of users who are already reading smarter with Enfinity.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handlePrimaryCta}
                  className="gap-2 bg-gradient-to-r from-primary to-primary/85 hover:from-primary/95 hover:to-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
                >
                  {isAuthenticated ? 'Open Dashboard' : 'Get Started for Free'}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background/70 py-12 relative z-10">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Social</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2026 Enfinity. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}