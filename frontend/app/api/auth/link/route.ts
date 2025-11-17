import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

    // Call backend linking endpoint which will set an httpOnly cookie on success
    const backendResp = await fetch(`${apiUrl}/auth/oauth/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // server-to-server fetch doesn't send browser cookies; backend can set cookie
    })

    const text = await backendResp.text()

    // Build headers to return to the browser. If backend set a cookie, forward it.
    const headers = new Headers()
    backendResp.headers.forEach((value, key) => headers.set(key, value))

    const backendSetCookie = backendResp.headers.get('set-cookie')
    if (backendSetCookie) {
      // forward Set-Cookie so browser stores backend cookie
      headers.set('set-cookie', backendSetCookie)
    }

    return new Response(text, { status: backendResp.status, headers })
  } catch (err: any) {
    console.error('Error in /api/auth/link:', err)
    return new Response(JSON.stringify({ success: false, message: err?.message || 'Unexpected error' }), { status: 500 })
  }
}
