import { AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import jwt from 'jsonwebtoken'

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log('Auth signIn callback invoked');

      if (account?.provider === 'google' && user.email) {
        
        const adminEmailsRaw = process.env.ADMIN_EMAILS || '';
        const adminEmails = adminEmailsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
        const isAdminEmail = adminEmails.includes(user.email.toLowerCase());

        if (isAdminEmail) {
          return true;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const resp = await fetch(`${apiUrl}/auth/oauth/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, googleId: account.providerAccountId, name: user.name })
          });

          if (!resp.ok) {
            console.warn('Google link check failed:', resp.status);
            return false;
          }

          const body = await resp.json();
          return body?.success === true;
        } catch (e) {
          console.error('Error contacting backend to link Google account:', e);
          return false;
        }
      }

      return false;
    },

    async jwt({ token, user }) {
      if (user) {
        token.email = user.email
        token.name = user.name

        try {
          const adminEmailsRaw = process.env.ADMIN_EMAILS || ''
          const adminEmails = adminEmailsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
          token.isAdmin = adminEmails.includes((user.email || '').toLowerCase())
        } catch (e) {
          token.isAdmin = false
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
          const resp = await fetch(`${apiUrl}/auth/oauth/link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, googleId: (user as any).id, name: user.name })
          });

          if (resp.ok) {
            const data = await resp.json();
            if (data?.success && data.data) {
              token.sub = data.data.id;
              token.studentId = data.data.studentId;
            }
          }
        } catch (e) {
          console.warn('Failed to attach backend user id to token:', e);
        }
      }
      return token
    },

    async session({ session, token }) {
      try {
        const signSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
        if (!signSecret) {
          console.warn('No JWT signing secret found (JWT_SECRET or NEXTAUTH_SECRET). Using insecure fallback.');
        }

        const payload: Record<string, unknown> = {
          email: token.email,
          name: token.name,
        }
        if (token.sub) payload.sub = token.sub

        const customToken = jwt.sign(payload, signSecret || 'dev_secret', {
          expiresIn: '15m',
        })

        console.log(customToken,"custom token");
        
        ;(session as any).token = customToken

        try {
          ;(session as any).user = { ...(session as any).user, isAdmin: Boolean((token as any).isAdmin) }
        } catch (e) {
          
        }
      } catch (e) {
        console.error('Failed to sign custom JWT for session:', e)
      }

      return session
    },
  },
  pages: {
    signIn: '/admin-access',
    error: '/api/auth/error-redirect',
  },
  session: {
    strategy: 'jwt',
  },
}