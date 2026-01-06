'use client';

import { createContext, useContext, ReactNode } from 'react';
import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react';

interface AuthUser {
  id: string;
  email: string | null | undefined;
  name: string | null | undefined;
  image: string | null | undefined;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const loading = status === 'loading';

  const user: AuthUser | null = session?.user
    ? {
      id: (session.user as any).id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    }
    : null;

  const signInWithGoogle = async () => {
    await nextAuthSignIn('google', { callbackUrl: '/' });
  };

  const signOut = async () => {
    await nextAuthSignOut({ callbackUrl: '/' });
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
