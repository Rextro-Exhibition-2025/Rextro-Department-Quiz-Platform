import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // This function will only be called if the user is authenticated
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        if (req.nextUrl.pathname.startsWith('/add-question')) {
          return !!token;
        }
        return true;
      },
    },
  }
)

export const config = {
  matcher: ['/add-question/:path*']
}
