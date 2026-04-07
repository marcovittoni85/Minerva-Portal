import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/accesso',
  '/forgot-password',
  '/portal/activate',
  '/access-expired',
]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/portal/activate')) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname === '/favicon.ico' || pathname === '/icon.webp') return true
  // static files (have a file extension)
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const isPortal = pathname.startsWith('/portal')
  const isAdminApi = pathname.startsWith('/api/admin')
  const needsAuth = isPortal || isAdminApi

  if (!needsAuth || isPublicPath(pathname)) {
    return response
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (isAdminApi) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'content-type': 'application/json' } }
      )
    }
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Check trial expiry
  const { data: profile } = await supabase
    .from('profiles')
    .select('trial_ends_at, documents_signed')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.trial_ends_at && !profile.documents_signed) {
    const expired = new Date(profile.trial_ends_at).getTime() < Date.now()
    if (expired && pathname !== '/access-expired') {
      if (isAdminApi) {
        return new NextResponse(
          JSON.stringify({ error: 'Access expired' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        )
      }
      const url = request.nextUrl.clone()
      url.pathname = '/access-expired'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/portal/:path*', '/api/admin/:path*'],
}
