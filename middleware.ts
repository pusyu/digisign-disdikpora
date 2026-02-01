import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from './lib/auth';

// Paths that don't require authentication
const publicPaths = ['/login', '/api/login', '/_next', '/favicon.ico', '/verify', '/analisis'];

export async function middleware(request: NextRequest) {
    const { nextUrl } = request;

    // Check if it's a public path
    if (publicPaths.some(path => nextUrl.pathname.startsWith(path))) {
        return NextResponse.next();
    }

    const session = request.cookies.get('session')?.value;

    if (!session) {
        if (nextUrl.pathname.startsWith('/api')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        await decrypt(session);
        return NextResponse.next();
    } catch (error) {
        console.error('Session verification failed:', error);
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
    }
}

export const config = {
    matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
