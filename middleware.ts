import { auth } from './src/lib/auth-edge'

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session

  const protectedPaths = ['/dashboard', '/sets', '/folders', '/profile', '/study', '/admin']
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
