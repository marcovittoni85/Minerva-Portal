import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(req: NextRequest) {
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

  const { data: { user } } = await supabase.auth.getUser();

  // Protezione cartella /portal
  if (user && req.nextUrl.pathname.startsWith('/portal')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('trial_ends_at, documents_signed')
      .eq('id', user.id)
      .single();

    // Controllo Scadenza 30 giorni
    if (profile && !profile.documents_signed && profile.trial_ends_at) {
      if (new Date() > new Date(profile.trial_ends_at)) {
        return NextResponse.redirect(new URL('/access-expired', req.url));
      }
    }
  }

  // Redirect se non loggato
  if (!user && req.nextUrl.pathname.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};