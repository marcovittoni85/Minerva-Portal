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
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // 1. Recupera l'utente e rinfresca la sessione
  const { data: { user } } = await supabase.auth.getUser();

  // 2. LOGICA DI PROTEZIONE: Se l'utente non è loggato e prova ad andare in /portal
  if (!user && req.nextUrl.pathname.startsWith('/portal')) {
    const url = req.nextUrl.clone();
    url.pathname = '/login'; // Assicurati che la tua pagina di login sia qui
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // Applica a tutto tranne file statici e immagini
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};