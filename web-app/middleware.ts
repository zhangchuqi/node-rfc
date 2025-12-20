import { auth } from '@/lib/auth';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  
  console.log('Middleware:', { 
    path: req.nextUrl.pathname, 
    isLoggedIn, 
    isAuthPage,
    hasAuth: !!req.auth 
  });

  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL('/auth/login', req.url);
    console.log('Redirecting to login:', loginUrl.toString());
    return Response.redirect(loginUrl);
  }

  if (isLoggedIn && isAuthPage) {
    return Response.redirect(new URL('/', req.url));
  }
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
