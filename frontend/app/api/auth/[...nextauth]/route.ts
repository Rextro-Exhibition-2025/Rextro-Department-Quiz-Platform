
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
<<<<<<< HEAD
    
    
    
=======
    // On Google sign-in, allow admin emails (from ADMIN_EMAILS) to sign in
    // without requiring the backend link check. For student accounts, keep
    // the existing backend `/auth/oauth/link` check.
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
    async signIn({ user, account }) {
      console.log('Auth signIn callback invoked');

      if (account?.provider === 'google' && user.email) {
<<<<<<< HEAD
        
=======
        // Normalize admin emails list from env
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
        const adminEmailsRaw = process.env.ADMIN_EMAILS || '';
        const adminEmails = adminEmailsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
        const isAdminEmail = adminEmails.includes(user.email.toLowerCase());

<<<<<<< HEAD
        
        
=======
        // If this is an admin email, allow sign-in immediately so admin flows
        // are handled by the admin UI (and won't be blocked by backend link checks).
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
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

<<<<<<< HEAD
      
      return false;
    },

    
    async jwt({ token, user }) {
      
=======
      // For non-Google providers, deny by default
      return false;
    },

    // Persist custom fields on the JWT that will be available in `session` callback
    async jwt({ token, user }) {
      // On initial sign in, `user` will be available — copy useful fields into the token
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
      if (user) {
        token.email = user.email
        token.name = user.name

<<<<<<< HEAD
        
        try {
          const adminEmailsRaw = process.env.ADMIN_EMAILS || ''
          const adminEmails = adminEmailsRaw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
          token.isAdmin = adminEmails.includes((user.email || '').toLowerCase())
        } catch (e) {
          token.isAdmin = false
        }

        
=======
        // Try to fetch linked backend user (id + studentId) and attach to token
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
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

<<<<<<< HEAD
    
=======
    // Create a custom short-lived JWT and attach it to the session object returned to the client
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
    async session({ session, token }) {
      try {
        const signSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
        if (!signSecret) {
          console.warn('No JWT signing secret found (JWT_SECRET or NEXTAUTH_SECRET). Using insecure fallback.');
        }

<<<<<<< HEAD
        
=======
        // Build payload — keep it minimal: email, name, sub
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
        const payload: Record<string, unknown> = {
          email: token.email,
          name: token.name,
        }
        if (token.sub) payload.sub = token.sub

<<<<<<< HEAD
        
=======
        // Sign a short-lived token for backend APIs to verify
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
        const customToken = jwt.sign(payload, signSecret || 'dev_secret', {
          expiresIn: '15m',
        })


        console.log(customToken,"custom token");
        

<<<<<<< HEAD
        
        ;(session as any).token = customToken

        
        try {
          ;(session as any).user = { ...(session as any).user, isAdmin: Boolean((token as any).isAdmin) }
        } catch (e) {
          
        }
=======
        // Expose it on session.token so client-side code can read it and send as Authorization header
        ;(session as any).token = customToken
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
      } catch (e) {
        console.error('Failed to sign custom JWT for session:', e)
      }

      return session
    },
  },
  pages: {
<<<<<<< HEAD
    signIn: '/admin-access',
    
    
    
=======
    signIn: '/admin/login',
    // Use a small server-side redirector so we can send admin-originated
    // OAuth errors back to the admin login UI while keeping student errors
    // routed to the student login page.
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
    error: '/api/auth/error-redirect',
  },
  session: {
    strategy: 'jwt',
  },
}


<<<<<<< HEAD


=======
// Use NextAuth handler directly for App Router. We export the handler for GET/POST
// so NextAuth can operate on the Request/Response provided by Next.js.
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
const nextAuthHandler = NextAuth(authOptions) as any

async function forwardCookiesAndReturn(nextAuthResponse: Response, request: Request) {
  try {
<<<<<<< HEAD
    
=======
    // Clone headers from NextAuth response
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
    const newHeaders = new Headers()
    nextAuthResponse.headers.forEach((value, key) => {
      newHeaders.set(key, value)
    })

<<<<<<< HEAD
    
    const setCookieHeader = nextAuthResponse.headers.get('set-cookie')
    if (setCookieHeader) {
      
=======
    // Try to extract NextAuth cookie (set-cookie) to call /api/auth/session
    const setCookieHeader = nextAuthResponse.headers.get('set-cookie')
    if (setCookieHeader) {
      // Extract cookie name=value pairs (strip attributes)
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
      const cookiePairs = setCookieHeader
        .split(/, (?=[^;]+=)/g)
        .map((c) => c.split(';')[0])
        .join('; ')

<<<<<<< HEAD
      
      const frontendOrigin = process.env.NEXTAUTH_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`

      
=======
      // Determine frontend origin to call the session endpoint
      const frontendOrigin = process.env.NEXTAUTH_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`

      // Request the session from NextAuth using the cookie received
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
      try {
        const sessionResp = await fetch(`${frontendOrigin}/api/auth/session`, {
          headers: {
            cookie: cookiePairs,
            accept: 'application/json',
          },
          credentials: 'include',
        })

        if (sessionResp.ok) {
          const sessionJson = await sessionResp.json()
          const email = sessionJson?.user?.email
          const name = sessionJson?.user?.name

          if (email) {
<<<<<<< HEAD
            
=======
            // Call backend linking endpoint so it can set its own httpOnly cookie
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
            const backendResp = await fetch(`${apiUrl}/auth/oauth/link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, name }),
            })

<<<<<<< HEAD
            
            const backendSetCookie = backendResp.headers.get('set-cookie')
            if (backendSetCookie) {
              
=======
            // If backend set a cookie, forward it to the browser by appending Set-Cookie header
            const backendSetCookie = backendResp.headers.get('set-cookie')
            if (backendSetCookie) {
              // Append backend Set-Cookie header so browser stores it
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
              newHeaders.append('set-cookie', backendSetCookie)
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch NextAuth session or link backend:', e)
      }
    }

<<<<<<< HEAD
    
=======
    // Build and return a Response with merged headers and same body/status
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
    const body = await nextAuthResponse.text()
    return new Response(body, { status: nextAuthResponse.status, headers: newHeaders })
  } catch (err) {
    console.error('Error forwarding cookies:', err)
    return nextAuthResponse
  }
}

<<<<<<< HEAD






export { nextAuthHandler as GET, nextAuthHandler as POST }


export { authOptions }
=======
// Export the NextAuth handler as the route entrypoints. We removed the
// custom forwarding logic here because it caused incompatibilities with the
// runtime Request shape in this environment. Instead, the frontend will call
// a small helper API route `/api/auth/link` after sign-in to ask the backend
// to set its own httpOnly cookie. That keeps the flow reliable and easier to
// reason about.
export { nextAuthHandler as GET, nextAuthHandler as POST }
>>>>>>> d49ab0e0eb8416b6d5ea3e973030d1afba98eeba
