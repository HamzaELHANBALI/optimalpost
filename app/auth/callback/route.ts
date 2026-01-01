import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const token = requestUrl.searchParams.get('token');
  const type = requestUrl.searchParams.get('type');
  const email = requestUrl.searchParams.get('email');
  const next = requestUrl.searchParams.get('next') ?? '/';
  const code = requestUrl.searchParams.get('code');

  // Handle email confirmation (can use either token_hash or token)
  if (type && (token_hash || token)) {
    const supabase = await createClient();
    
    // For email type, we need the email parameter
    if (type === 'email') {
      if (email && token_hash) {
        const { error } = await supabase.auth.verifyOtp({
          type: 'email',
          email,
          token_hash,
        });
        if (!error) {
          return NextResponse.redirect(new URL(next, request.url));
        }
      } else if (token) {
        // For token-based email confirmation, try to verify
        // If email is not provided, Supabase might handle it automatically
        // by checking the session after redirect
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!error && user) {
          return NextResponse.redirect(new URL(next, request.url));
        }
      }
    } else {
      // For other OTP types (recovery, magiclink, etc.)
      // Build the params object based on what we have
      const otpType = type as 'recovery' | 'magiclink' | 'invite' | 'email_change';
      
      if (token_hash) {
        // Use token_hash (email is optional for these types)
        const params: any = {
          type: otpType,
          token_hash,
        };
        if (email) {
          params.email = email;
        }
        const { error } = await supabase.auth.verifyOtp(params);
        if (!error) {
          return NextResponse.redirect(new URL(next, request.url));
        }
      } else if (token) {
        // Use token (email might be required for some types)
        const params: any = {
          type: otpType,
          token,
        };
        if (email) {
          params.email = email;
        }
        const { error } = await supabase.auth.verifyOtp(params);
        if (!error) {
          return NextResponse.redirect(new URL(next, request.url));
        }
      }
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

