import { clerkMiddleware } from '@clerk/nextjs/server';

// clerkMiddleware sets up auth context for auth() to work in server components
// Route protection is handled in layout.tsx, not here (no auth.protect() call)
export default clerkMiddleware();

export const config = {
	matcher: [
		// Skip Next.js internals and all static files
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		// Always run for API routes
		'/(api|trpc)(.*)',
	],
};
