'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Zap, Eye, BarChart3, BookOpen, Brain, Shield, Sparkles, Moon, Sun } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useTheme } from '@/providers/ThemeProvider';

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
  const { theme, toggleTheme } = useTheme();
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
      if (now - lastTrailTimeRef.current < 30) return;
      lastTrailTimeRef.current = now;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Enhanced color range: teal to indigo with pink and yellow accents
      const hues = [170, 190, 210, 240, 260, 330, 45];
      const hue = hues[Math.floor((now * 0.08) % hues.length)];
      const trailId = `trail-${trailIndexRef.current++}`;
      const size = Math.random() * 6 + 4;

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
        return updated.slice(-40);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const fadeInterval = setInterval(() => {
      setTrails((prev) =>
        prev
          .map((trail) => {
            const age = Date.now() - trail.createdAt;
            const fadeDuration = 600;
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
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:relative dark:overflow-hidden transition-colors duration-300">
      {/* Light mode background */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-teal-100/40 blur-3xl dark:bg-teal-600/15 dark:hidden" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-100/40 blur-3xl dark:bg-indigo-600/15 dark:hidden" />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full bg-cyan-100/30 blur-3xl dark:bg-cyan-600/10 dark:hidden" />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-pink-100/30 blur-3xl dark:bg-pink-600/12 dark:hidden" />
      <div className="absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-yellow-100/20 blur-3xl dark:bg-yellow-600/10 dark:hidden" />

      {/* Dark mode background blobs */}
      <div className="hidden dark:absolute -top-24 -left-24 w-80 h-80 rounded-full bg-teal-600/15 blur-3xl dark:block" />
      <div className="hidden dark:absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl dark:block" />
      <div className="hidden dark:absolute top-1/2 left-1/3 w-72 h-72 rounded-full bg-cyan-600/10 blur-3xl dark:block" />
      <div className="hidden dark:absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-pink-600/12 blur-3xl dark:block" />
      <div className="hidden dark:absolute bottom-1/3 left-1/4 w-56 h-56 rounded-full bg-yellow-600/10 blur-3xl dark:block" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-slate-700/40 bg-white/90 dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-900/70 dark:backdrop-blur-xl dark:shadow-md dark:shadow-black/30 backdrop-blur-sm transition-all duration-300">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 via-cyan-500 to-pink-500 text-white flex items-center justify-center font-semibold shadow-md shadow-teal-500/20 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-pink-500/30 group-hover:scale-110">
              <BookOpen className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12" />
            </div>
            <span className="text-lg font-semibold bg-gradient-to-r from-teal-600 via-cyan-600 to-pink-600 dark:from-teal-300 dark:via-cyan-300 dark:to-pink-300 bg-clip-text text-transparent tracking-tight transition-all duration-500 group-hover:from-teal-700 dark:group-hover:from-teal-200 group-hover:to-pink-700 dark:group-hover:to-pink-200">NeuroLens</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleDashboardClick}
                  className="text-sm sm:text-base px-3 sm:px-4 text-gray-700 dark:text-slate-300 transition-all duration-300 hover:bg-teal-50 dark:hover:bg-teal-500/10 hover:text-teal-700 dark:hover:text-teal-300 focus-visible:ring-teal-400/30"
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onSignOut?.()}
                  className="text-sm sm:text-base px-3 sm:px-4 border-gray-300 dark:border-slate-600/40 bg-white dark:bg-slate-800/40 text-gray-700 dark:text-slate-300 transition-all duration-300 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-300 dark:hover:border-red-500/40 hover:text-red-700 dark:hover:text-red-400 focus-visible:ring-red-400/30"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/sign-in')}
                  className="text-sm sm:text-base px-3 sm:px-4 text-gray-700 dark:text-slate-300 transition-all duration-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:text-indigo-300 focus-visible:ring-indigo-400/30"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/sign-in?mode=signup')}
                  className="text-sm sm:text-base px-3 sm:px-4 bg-gradient-to-r from-teal-600 via-pink-600 to-indigo-600 hover:from-teal-500 hover:via-pink-500 hover:to-indigo-500 text-white shadow-md shadow-pink-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/30 focus-visible:ring-teal-400/30"
                >
                  Get Started
                </Button>
              </>
            )}
            <button
              onClick={toggleTheme}
              className="p-2 ml-2 rounded-lg bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all duration-300"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroSectionRef} className="relative w-full py-24 md:py-40 z-10 overflow-hidden bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
        {/* Cursor Trail - Enhanced with Pink and Yellow */}
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
                background: `radial-gradient(ellipse 60px 40px at center, hsla(${trail.hue}, 85%, 55%, ${trail.opacity * 0.8}), hsla(${(trail.hue + 30) % 360}, 80%, 45%, ${trail.opacity * 0.4}), transparent 70%)`,
                filter: `blur(25px) drop-shadow(0 0 40px hsla(${(trail.hue + 15) % 360}, 85%, 50%, ${trail.opacity * 0.5}))`,
                transition: 'opacity 0.4s ease-out',
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>

        {/* Light mode gradient blobs */}
        <div className="dark:hidden absolute inset-0">
          <div className="absolute top-0 left-0 w-[550px] h-[550px] rounded-full blur-3xl opacity-30 -translate-x-1/4 -translate-y-1/4"
            style={{ background: 'radial-gradient(circle at 30% 30%, hsl(175, 90%, 70%), transparent 65%)' }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-25 translate-x-1/5 translate-y-1/5"
            style={{ background: 'radial-gradient(circle at 70% 70%, hsl(240, 85%, 65%), transparent 65%)' }} />
          <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-25 translate-x-1/4"
            style={{ background: 'radial-gradient(circle at 50% 50%, hsl(185, 90%, 65%), transparent 65%)' }} />
          <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full blur-3xl opacity-20 translate-x-1/3"
            style={{ background: 'radial-gradient(circle at 50% 50%, hsl(330, 85%, 70%), transparent 65%)' }} />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full blur-3xl opacity-15 -translate-x-1/4"
            style={{ background: 'radial-gradient(circle at 50% 50%, hsl(45, 95%, 70%), transparent 65%)' }} />
          <div className="absolute top-1/2 left-0 w-[350px] h-[350px] rounded-full blur-3xl opacity-20 -translate-y-1/2 -translate-x-1/4"
            style={{ background: 'radial-gradient(circle, hsl(170, 88%, 65%), transparent 65%)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        </div>

        {/* Dark mode gradient blobs */}
        <div className="hidden dark:block absolute inset-0">
          <div className="absolute top-0 left-0 w-[550px] h-[550px] rounded-full blur-3xl opacity-40 -translate-x-1/4 -translate-y-1/4"
            style={{ background: 'radial-gradient(circle at 30% 30%, hsl(175, 90%, 45%), transparent 65%)' }} />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-35 translate-x-1/5 translate-y-1/5"
            style={{ background: 'radial-gradient(circle at 70% 70%, hsl(240, 85%, 40%), transparent 65%)' }} />
          <div className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full blur-3xl opacity-30 translate-x-1/4"
            style={{ background: 'radial-gradient(circle at 50% 50%, hsl(185, 90%, 42%), transparent 65%)' }} />
          <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full blur-3xl opacity-25 translate-x-1/3"
            style={{ background: 'radial-gradient(circle at 50% 50%, hsl(330, 85%, 50%), transparent 65%)' }} />
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full blur-3xl opacity-20 -translate-x-1/4"
            style={{ background: 'radial-gradient(circle at 50% 50%, hsl(45, 95%, 55%), transparent 65%)' }} />
          <div className="absolute top-1/2 left-0 w-[350px] h-[350px] rounded-full blur-3xl opacity-25 -translate-y-1/2 -translate-x-1/4"
            style={{ background: 'radial-gradient(circle, hsl(170, 88%, 38%), transparent 65%)' }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/40 to-transparent" />
        </div>

        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 dark:bg-slate-800/50 dark:backdrop-blur-md border border-pink-200 dark:border-pink-500/30 text-sm font-medium mb-8">
                <Sparkles className="w-4 h-4 text-pink-500 dark:text-pink-400" />
                <span className="text-gray-700 dark:text-slate-200">Adaptive reading, reimagined</span>
              </div>
            </div>
            <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-tight text-gray-900 dark:text-white">
                {isAuthenticated ? 'Resume Your Reading Flow' : 'Read Smarter, Learn Faster'}
              </h1>
              <p className="text-lg md:text-2xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                {isAuthenticated
                  ? 'Pick up where you left off in your dashboard, with your documents, folders, and reading sessions ready to go.'
                  : 'NeuroLens transforms how you read and learn. Intelligent analysis, eye-strain protection, and concept mapping in one focused workspace.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Button
                size="lg"
                onClick={handlePrimaryCta}
                className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/35 transition-all duration-300"
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
                className="border-gray-300 dark:border-slate-600/60 bg-white dark:bg-slate-800/40 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700/60 hover:border-pink-300 dark:hover:border-pink-500/50 hover:text-pink-700 dark:hover:text-pink-300 transition-all duration-300"
              >
                {isAuthenticated ? 'Sign Out' : 'Learn More'}
              </Button>
            </div>

            <div className="mt-16 flex flex-wrap items-center justify-center gap-3">
              {(isAuthenticated
                ? ['Dashboard Ready', 'Saved Sessions', 'Personalized Reading']
                : ['Zero-Chrome Reading', 'Adaptive Text', 'Eye-Strain Protection']
              ).map((item) => (
                <span key={item} className="px-3 py-1.5 rounded-full bg-pink-50 dark:bg-slate-800/50 dark:backdrop-blur-md border border-pink-200 dark:border-pink-500/30 text-xs font-semibold text-pink-700 dark:text-pink-200">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28 relative z-10 bg-gray-50 dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-pink-600 to-indigo-600 dark:from-teal-300 dark:via-pink-300 dark:to-indigo-300 bg-clip-text text-transparent mb-4">Powerful Features</h2>
            <p className="text-lg text-gray-600 dark:text-slate-400">
              Everything you need to read smarter and learn faster.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const colors = [
                'from-teal-600 to-cyan-600',
                'from-pink-600 to-rose-600',
                'from-cyan-600 to-teal-600',
                'from-yellow-600 to-orange-600',
                'from-teal-600 to-pink-600',
                'from-indigo-600 to-purple-600',
              ];
              const shadowColors = [
                'shadow-teal-500/20',
                'shadow-pink-500/20',
                'shadow-cyan-500/20',
                'shadow-yellow-500/20',
                'shadow-teal-500/20',
                'shadow-indigo-500/20',
              ];
              
              return (
                <div key={index} className="bg-white dark:bg-slate-800/40 dark:backdrop-blur-md rounded-2xl p-6 border border-gray-200 dark:border-slate-700/60 hover:border-pink-300 dark:hover:border-pink-500/40 hover:shadow-lg dark:hover:-translate-y-2 dark:hover:bg-slate-800/60 transition-all duration-300">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[index % 6]} text-white mb-4 shadow-md ${shadowColors[index % 6]}`}>
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-100 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-28 relative z-10 bg-white dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 transition-colors duration-300">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 via-pink-600 to-yellow-600 dark:from-cyan-300 dark:via-pink-300 dark:to-yellow-300 bg-clip-text text-transparent mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 dark:text-slate-400">
              Get started in 4 simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const stepColors = [
                'from-teal-600 to-cyan-600',
                'from-pink-600 to-rose-600',
                'from-yellow-600 to-orange-600',
                'from-indigo-600 to-purple-600',
              ];
              const gradientColors = [
                'from-teal-500/50',
                'from-pink-500/50',
                'from-yellow-500/50',
                'from-indigo-500/50',
              ];

              return (
                <div key={index} className="relative">
                  <div className="mb-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${stepColors[index % 4]} text-white font-bold text-lg shadow-md shadow-teal-500/15`}>
                      {step.number}
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-100 mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">{step.description}</p>
                  {index < steps.length - 1 && (
                    <div className={`hidden md:block absolute top-6 left-full w-8 h-0.5 bg-gradient-to-r ${gradientColors[index % 4]} to-transparent`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 relative z-10">
        <div className="container">
          <div className="mx-auto max-w-4xl relative rounded-3xl overflow-hidden">
            {/* Light mode background */}
            <div className="absolute inset-0 -z-10 dark:hidden">
              <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-25"
                style={{ background: 'radial-gradient(circle, hsl(175, 90%, 70%), transparent 65%)' }} />
              <div className="absolute -top-20 -right-40 w-96 h-96 rounded-full blur-3xl opacity-25"
                style={{ background: 'radial-gradient(circle, hsl(330, 85%, 70%), transparent 65%)' }} />
              <div className="absolute -bottom-32 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20"
                style={{ background: 'radial-gradient(circle, hsl(45, 95%, 70%), transparent 65%)' }} />
              <div className="absolute -bottom-20 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20"
                style={{ background: 'radial-gradient(circle, hsl(240, 85%, 65%), transparent 65%)' }} />
              <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50" />
            </div>

            {/* Dark mode background */}
            <div className="hidden dark:block absolute inset-0 -z-10">
              <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-40"
                style={{ background: 'radial-gradient(circle, hsl(175, 90%, 45%), transparent 65%)' }} />
              <div className="absolute -top-20 -right-40 w-96 h-96 rounded-full blur-3xl opacity-40"
                style={{ background: 'radial-gradient(circle, hsl(330, 85%, 50%), transparent 65%)' }} />
              <div className="absolute -bottom-32 -left-40 w-80 h-80 rounded-full blur-3xl opacity-35"
                style={{ background: 'radial-gradient(circle, hsl(45, 95%, 55%), transparent 65%)' }} />
              <div className="absolute -bottom-20 -right-32 w-96 h-96 rounded-full blur-3xl opacity-30"
                style={{ background: 'radial-gradient(circle, hsl(240, 85%, 40%), transparent 65%)' }} />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
            </div>

            <div className="relative p-10 md:p-16 text-center">
              {/* Colorful accent bars */}
              <div className="absolute top-0 left-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-pink-300 dark:via-pink-400/60 to-transparent transform -translate-x-1/2" />
              <div className="absolute bottom-0 left-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-yellow-300 dark:via-yellow-400/60 to-transparent transform -translate-x-1/2" />

              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                Ready to Transform Your Reading?
              </h2>

              <p className="text-lg md:text-xl text-gray-600 dark:text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of users who are already reading smarter with NeuroLens.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handlePrimaryCta}
                  className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/35 transition-all duration-300"
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
      <footer className="border-t border-gray-200 dark:border-slate-700/40 bg-white dark:bg-slate-950/80 dark:backdrop-blur-sm py-12 relative z-10 transition-colors duration-300">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Cookies</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-slate-100 mb-4">Social</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-slate-400">
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-gray-900 dark:hover:text-slate-200 transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-slate-700/40 pt-8 text-center text-sm text-gray-600 dark:text-slate-400">
            <p>&copy; 2026 NeuroLens. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}