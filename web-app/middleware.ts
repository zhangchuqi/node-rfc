import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 检查是否是认证相关的路径
  const isAuthPage = pathname.startsWith('/auth');
  
  // 检查 session cookie
  const sessionToken = request.cookies.get('authjs.session-token') || 
                       request.cookies.get('__Secure-authjs.session-token');
  
  const isLoggedIn = !!sessionToken;
  
  console.log('Middleware check:', { 
    pathname, 
    isLoggedIn, 
    isAuthPage,
    hasSessionToken: !!sessionToken
  });

  // 如果未登录且不在认证页面，重定向到登录页
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL('/auth/login', request.url);
    console.log('Redirecting to login from:', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 如果已登录且在认证页面，重定向到首页
  if (isLoggedIn && isAuthPage) {
    console.log('Already logged in, redirecting to home');
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
