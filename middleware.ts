import { auth } from './src/lib/auth-edge'
import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'

export default auth(async (req) => {
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
    // Đọc thẳng từ JWT token để tránh lỗi custom fields không được truyền qua req.auth
    const token = await getToken({ req: req as unknown as NextRequest, secret: process.env.AUTH_SECRET })
    if ((token as any)?.role !== 'admin') {
      return Response.redirect(new URL('/dashboard', nextUrl))
    }
  }
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
