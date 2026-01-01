import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // For auth callback routes, let them handle the token exchange first
  // The callback route will handle email confirmations and OAuth redirects
  const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback');
  
  // If we have auth-related parameters on a non-callback route, redirect to callback
  const code = request.nextUrl.searchParams.get('code');
  const token_hash = request.nextUrl.searchParams.get('token_hash');
  const token = request.nextUrl.searchParams.get('token');
  const type = request.nextUrl.searchParams.get('type');
  
  if (!isAuthCallback && (code || token_hash || (token && type))) {
    const callbackUrl = new URL('/auth/callback', request.url);
    // Copy all query parameters to the callback URL
    request.nextUrl.searchParams.forEach((value, key) => {
      callbackUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(callbackUrl);
  }
  
  if (!isAuthCallback) {
    // Refreshing the auth token for non-callback routes
    await supabase.auth.getUser();
  }

  return supabaseResponse;
}


