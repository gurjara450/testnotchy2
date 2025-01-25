import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define route matchers
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/landing(.*)',
  '/api/webhook'
]);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/notebooks(.*)',
  '/api/notebooks(.*)'
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  // If it's a public route, no authentication required
  if (isPublicRoute(request)) return;

  // For protected routes and any other non-public route, require authentication
  if (isProtectedRoute(request) || !isPublicRoute(request)) {
    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static assets unless explicitly matched
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Apply middleware to API and tRPC routes
    '/(api|trpc)(.*)',
  ],
};