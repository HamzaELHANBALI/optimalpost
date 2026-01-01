'use client';

import { ProvenPostLogo } from '@/components/logo';
import { AuthButton } from '@/components/auth/auth-button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { History } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface HeaderProps {
  onHistoryClick?: () => void;
  showHistory?: boolean;
}

export function Header({ onHistoryClick, showHistory = false }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ProvenPostLogo />
        </div>
        <div className="flex items-center gap-2">
          {user && showHistory && (
            <Button
              variant="outline"
              size="sm"
              onClick={onHistoryClick}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </Button>
          )}
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </header>
  );
}

