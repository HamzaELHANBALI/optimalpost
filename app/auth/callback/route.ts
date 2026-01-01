import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const token = requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/';
  const code = requestUrl.searchParams.get('code');

  // Handle email confirmation (can use either token_hash or token)
  if (type && (token_hash || token)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      ...(token_hash ? { token_hash } : { token }),
    });

    if (!error) {
      // Redirect to home page after successful verification
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  if (code) {
    // Handle OAuth callback (Google)
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Redirect to home page after successful OAuth
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // If there's an error or no valid params, redirect to home with error
  return NextResponse.redirect(new URL(`/?error=auth_failed`, request.url));
}

