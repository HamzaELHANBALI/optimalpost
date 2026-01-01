'use client';

import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Dashboard } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { AuthDialog } from '@/components/auth/auth-dialog';

export default function Home() {
  const { user, loading } = useAuth();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show dashboard for authenticated users
  if (user) {
    return (
      <div className="min-h-screen">
        <Header onHistoryClick={() => setHistoryOpen(true)} showHistory />
        <Dashboard historyOpen={historyOpen} onHistoryOpenChange={setHistoryOpen} />
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorks />
        {/* Final CTA Section */}
        <section className="py-24 sm:py-32 bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Ready to Scale Your Content?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Start analyzing your viral scripts and generating high-performing variations today.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => setAuthDialogOpen(true)}
                  className="group h-12 px-8 text-base font-semibold shadow-lg transition-all hover:shadow-xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base"
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </div>
  );
}
