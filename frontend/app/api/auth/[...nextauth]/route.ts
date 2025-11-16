
import NextAuth, { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import jwt from 'jsonwebtoken'

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Restrict Google sign-in to emails listed in ADMIN_EMAILS
    async signIn({ user, account }) {
      console.log('Auth signIn callback invoked');

      // Read allowed admin emails from environment, default to a placeholder list
      const adminEmailsEnv = process.env.ADMIN_EMAILS || 'admin@school.edu,teacher@school.edu'
      const adminEmails = adminEmailsEnv.split(',').map(email => email.trim())

      if (account?.provider === 'google' && user.email) {
        // Only allow sign-in if the user's email is in the admin list
        return adminEmails.includes(user.email)
      }
      return false
    },

    // Persist custom fields on the JWT that will be available in `session` callback
    async jwt({ token, user }) {
      // On initial sign in, `user` will be available — copy useful fields into the token
      if (user) {
        token.email = user.email
        token.name = user.name
      
        
        // NextAuth might set `sub` already, but preserve if present
        if ((user as any).id) token.sub = (user as any).id
      }
      return token
    },

    // Create a custom short-lived JWT and attach it to the session object returned to the client
    async session({ session, token }) {
      try {
        const signSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
        if (!signSecret) {
          console.warn('No JWT signing secret found (JWT_SECRET or NEXTAUTH_SECRET). Using insecure fallback.');
        }

        // Build payload — keep it minimal: email, name, sub
        const payload: Record<string, unknown> = {
          email: token.email,
          name: token.name,
        }
        if (token.sub) payload.sub = token.sub

        // Sign a short-lived token for backend APIs to verify
        const customToken = jwt.sign(payload, signSecret || 'dev_secret', {
          expiresIn: '15m',
        })


        console.log(customToken,"custom token");
        

        // Expose it on session.token so client-side code can read it and send as Authorization header
        ;(session as any).token = customToken
      } catch (e) {
        console.error('Failed to sign custom JWT for session:', e)
      }

      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  session: {
    strategy: 'jwt',
  },
}


const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
