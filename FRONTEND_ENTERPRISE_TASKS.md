# Frontend Enterprise & Architecture Refinements

Based on our final architecture review, here are the step-by-step tasks to bring the frontend to true "Enterprise-Grade" standards. I have indicated which AI agent is best suited for each task. The Proposals Engine is intentionally excluded for now.

---

## 🛑 Use CODEX for These Tasks

### Task 1: End-to-End Type Safety (OpenAPI Generator)
**Why Codex?** This involves modifying the backend and frontend package setups, writing code generation configurations, and doing a massive find-and-replace to swap manual types with generated types.
**Instructions for Codex:**
1. Install an OpenAPI generator tool in the frontend (e.g., `npm install -D orval` or `openapi-typescript`).
2. Add a script to `package.json` (e.g., `"generate:api": "orval"`) that hits the backend's `/api/v1/docs-json` endpoint to generate the client.
3. Create `orval.config.ts` configured for React Query (`query`) output into a new `src/api-generated/` folder.
4. Replace the manual `CreateProductDto` and `UpdateProductDto` in `src/lib/product.service.ts` and `_schema.ts` with the auto-generated types from the OpenAPI schema.

### Task 2: React Server Components (RSC) for Faster Initial Loads
**Why Codex?** Moving data hydration into Server Components inside the Next.js App Router requires deep understanding of React Query's `HydrationBoundary`, `dehydrate`, and React Server Components.
**Instructions for Codex:**
1. Open `src/app/[locale]/dashboard/products/page.tsx`.
2. Convert it into an `async` Server Component by removing `'use client'`. 
3. Fetch the initial list of products directly from the server using `getQueryClient()` and `prefetchQuery`.
4. Wrap the Client Component (e.g., `<ProductsCatalog />`) in a `<HydrationBoundary state={dehydrate(queryClient)}>` so the initial page load has data embedded directly in the HTML without waiting for the browser to fetch it.

---

## ⚡ Use HAIKU for These Tasks

### Task 3: Observability (Sentry & PostHog)
**Why Haiku?** Integrating these tools largely requires adding third-party scripts, wrapping providers, and simple `next.config.js` edits.
**Instructions for Haiku:**
1. Install `npm install @sentry/nextjs posthog-js`.
2. Add `.env` definitions for `NEXT_PUBLIC_SENTRY_DSN` and `NEXT_PUBLIC_POSTHOG_KEY` (use mock strings for now).
3. Set up PostHog: create `src/providers/PostHogProvider.tsx` that initializes `posthog` and returns the `<PostHogProvider client={posthog}>`.
4. Wrap the root `src/app/[locale]/layout.tsx` in `<PostHogProvider>`.
5. Create an `error.tsx` at `src/app/[locale]/dashboard/error.tsx` that catches any unhandled React exceptions, automatically submits them to `Sentry.captureException(error)`, and presents a "Something went wrong" UI to the user.
