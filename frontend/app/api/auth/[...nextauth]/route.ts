
import NextAuth from 'next-auth'
import { authOptions } from '../../../../lib/auth'

const nextAuthHandler = NextAuth(authOptions) as any

async function forwardCookiesAndReturn(nextAuthResponse: Response, request: Request) {
  try {
    
    const newHeaders = new Headers()
    nextAuthResponse.headers.forEach((value, key) => {
      newHeaders.set(key, value)
    })

    
    const setCookieHeader = nextAuthResponse.headers.get('set-cookie')
    if (setCookieHeader) {
      
      const cookiePairs = setCookieHeader
        .split(/, (?=[^;]+=)/g)
        .map((c) => c.split(';')[0])
        .join('; ')

      
      const frontendOrigin = process.env.NEXTAUTH_URL || `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`

      
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
            
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
            const backendResp = await fetch(`${apiUrl}/auth/oauth/link`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, name }),
            })

            
            const backendSetCookie = backendResp.headers.get('set-cookie')
            if (backendSetCookie) {
              
              newHeaders.append('set-cookie', backendSetCookie)
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch NextAuth session or link backend:', e)
      }
    }

    
    const body = await nextAuthResponse.text()
    return new Response(body, { status: nextAuthResponse.status, headers: newHeaders })
  } catch (err) {
    console.error('Error forwarding cookies:', err)
    return nextAuthResponse
  }
}

export { nextAuthHandler as GET, nextAuthHandler as POST }
