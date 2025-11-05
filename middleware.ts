import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // /write 경로는 로그인한 사용자만 접근 가능
        if (req.nextUrl.pathname.startsWith('/write')) {
          return !!token
        }
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/write/:path*'],
}