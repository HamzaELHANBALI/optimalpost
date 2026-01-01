'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useAssetLibrary } from '@/hooks/use-asset-library';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';

export function MigrationPrompt() {
  const { user } = useAuth();
  const { migrateFromLocalStorage } = useAssetLibrary();
  const [show, setShow] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrated, setMigrated] = useState(false);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const hasLocalData = localStorage.getItem('optimalpost-sessions');
      if (hasLocalData) {
        try {
          const sessions = JSON.parse(hasLocalData);
          if (sessions && sessions.length > 0) {
            setShow(true);
          }
        } catch {
          // Invalid data, ignore
        }
      }
    }
  }, [user]);

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      await migrateFromLocalStorage();
      setMigrated(true);
      setTimeout(() => {
        setShow(false);
      }, 2000);
    } catch (err) {
      console.error('Migration failed:', err);
      alert('Failed to migrate sessions. Please try again.');
    } finally {
      setMigrating(false);
    }
  };

  if (!show) return null;

  if (migrated) {
    return (
      <Alert className="mb-4 border-green-500/50 bg-green-500/10">
        <AlertDescription className="text-green-600 dark:text-green-400">
          Sessions migrated successfully!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4">
      <Upload className="h-4 w-4" />
      <AlertTitle>Migrate your sessions</AlertTitle>
      <AlertDescription>
        <div className="flex items-center justify-between gap-4 mt-2">
          <span>
            You have sessions stored locally. Would you like to migrate them to your account?
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handleMigrate}
              disabled={migrating}
            >
              {migrating ? 'Migrating...' : 'Migrate'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShow(false)}
              disabled={migrating}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

