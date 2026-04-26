import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)'])

// Rutas API que aceptan Clerk session/JWT o API key (zb_pat_).
// El middleware NO las protege: cada handler corre getAuth(request) y decide.
const isProgrammaticApi = createRouteMatcher([
  '/api/boards',
  '/api/boards/(.*)',
  '/api/tasks',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return
  if (isProgrammaticApi(req)) return
  await auth.protect()
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
