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

  // Use getSession (reads cookie, no API call) to avoid rate limits
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  // Redirect se non loggato
  if (!user && req.nextUrl.pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/login?redirect=' + encodeURIComponent(req.nextUrl.pathname), req.url));
  }

  // Protezione cartella /portal — trial check
  if (user && req.nextUrl.pathname.startsWith('/portal')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_ends_at, documents_signed')
      .eq('id', user.id)
      .single();

    if (profile && !profile.documents_signed && profile.trial_ends_at) {
      if (new Date() > new Date(profile.trial_ends_at)) {
        return NextResponse.redirect(new URL('/access-expired', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};