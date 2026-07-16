import { auth } from './src/lib/auth-edge'

export default auth((req) => {
  const { nextUrl, method } = req
  const session = req.auth
  const isLoggedIn = !!session
  const userId = (session?.user as any)?.id ?? '-'

  // Request logging
  console.log(JSON.stringify({
    t: new Date().toISOString(),
    method,
    path: nextUrl.pathname,
    userId,
  }))

  const protectedPaths = ['/dashboard', '/sets', '/folders', '/explore', '/profile', '/study', '/admin', '/ai-settings', '/ai-extract']
  const isProtected = protectedPaths.some(p => nextUrl.pathname.startsWith(p))

  if (isProtected && !isLoggedIn) {
    return Response.redirect(new URL('/login', nextUrl))
  }

  if (nextUrl.pathname.startsWith('/admin')) {
    if ((session?.user as any)?.role !== 'admin') {
      return Response.redirect(new URL('/dashboard', nextUrl))
    }
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
