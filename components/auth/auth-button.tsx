'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { AuthDialog } from './auth-dialog';
import { LogIn, LogOut, User } from 'lucide-react';

export function AuthButton() {
  const { user, loading, signOut } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <User className="h-4 w-4" />
      </Button>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">
          {user.email}
        </span>
        <Button variant="outline" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
        <LogIn className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Sign In</span>
      </Button>
      <AuthDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}


