import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const error = url.searchParams.get('error') || 'AccessDenied'

    const cookieHeader = request.headers.get('cookie') || ''
    const isAdminOrigin = /(?:^|; )oauth_origin=admin(?:;|$)/.test(cookieHeader)

    const target = isAdminOrigin ? `/admin-access?error=${encodeURIComponent(error)}` : `/login?error=${encodeURIComponent(error)}`

    
    const headers = new Headers()
    headers.set('location', target)
    headers.append('set-cookie', 'oauth_origin=; Path=/; Max-Age=0')

    return new Response(null, { status: 307, headers })
  } catch (e) {
    console.error('error-redirect handler failed:', e)
    return new Response(null, { status: 500 })
  }
}
