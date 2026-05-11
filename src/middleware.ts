import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: { headers: req.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const path = req.nextUrl.pathname;

  // 1. Non autenticato + path /portal → login
  if (!user && path.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // 2. Autenticato: gate onboarding via profile flags
  //    Skip su /portal/onboarding/* e /portal/change-password per evitare loop
  if (user && path.startsWith('/portal')) {
    const isOnboardingPath = path.startsWith('/portal/onboarding') || path === '/portal/change-password';

    if (!isOnboardingPath) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, must_change_password, onboarding_completed')
          .eq('id', user.id)
          .maybeSingle();

        // Solo se profile esiste E utente non è admin
        if (profile && profile.role !== 'admin') {
          if (profile.must_change_password === true) {
            return NextResponse.redirect(new URL('/portal/change-password', req.url));
          }
          if (profile.onboarding_completed === false) {
            return NextResponse.redirect(new URL('/portal/onboarding', req.url));
          }
        }
      } catch {
        // Se la query fallisce, lascia passare per evitare lockout
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api|login|signup|access-expired).*)"],
};