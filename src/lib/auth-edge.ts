import NextAuth from 'next-auth'

// Edge-compatible auth config (no DB calls, only JWT session validation)
export const { auth } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.isLocked = (user as any).isLocked
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).role = token.role
        ;(session.user as any).isLocked = token.isLocked
      }
      return session
    },
  },
  providers: [],
})
