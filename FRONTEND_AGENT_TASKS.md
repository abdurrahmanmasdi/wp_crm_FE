# Frontend Refactoring Tasks

We have completed **Task 1** (Auth Session Lifecycle). The system now successfully revokes the backend token on logout and intercepts 401s perfectly without infinite queuing.

For the remaining tasks, I have divided them based on complexity. **Codex** is necessary for architectural refactoring that stretches across many files. **Haiku** is perfect for isolated, repetitive tasks like translations and Zod schemas.

---

## 🛑 Use CODEX for These Tasks

### Task 2: Explicit Tenant API Routing
**Why Codex?** We need the *Explicit Parameter* approach. URL rewriting via Axios is fragile. We need to manually update `product.service.ts` and all the React hooks that use it. This touches 5+ files including React Query keys.
**Instructions for Codex:**
1. Open `src/lib/product.service.ts` and update every method signature to accept `organizationId: string` as the first argument. Update the Axios string to `/organizations/${organizationId}/products...`.
2. Open `src/app/[locale]/dashboard/products/page.tsx` and update the `useQuery` call to pass `activeOrganizationId` into `productService.getAll(...)`.
3. Update `CreateProductForm.tsx` (for Create/Update/Delete mutations) and `edit/[id]/page.tsx` (for GetById) to pull `activeOrganizationId` from `useAuthStore` and pass it into the service methods.

### Task 3: Resolve Component Bloat
**Why Codex?** Dissecting a 900-line file without breaking React scopes requires high-level semantic reasoning.
**Instructions for Codex:**
1. Open `src/app/[locale]/dashboard/products/page.tsx`.
2. Extract the `ProductDetailsDrawer` function into a new file: `src/app/[locale]/dashboard/products/_components/ProductDrawer.tsx`.
3. Extract `ProductsFilterBar` into `_components/ProductsFilterBar.tsx`.
4. Extract `ProductListRow` and `ProductCard` into their own files.
5. In `page.tsx`, import them cleanly and ensure the page is <250 lines long.

---

## ⚡ Use HAIKU for These Tasks

### Task 4: Global WebSocket Invalidation
**Instructions for Haiku:**
1. Create a new file `src/providers/SocketProvider.tsx`.
2. It should accept `{ children }` and read the `access_token` from cookies. Initialize `socket.io-client` against `process.env.NEXT_PUBLIC_SOCKET_URL` (or fallback to `http://localhost:3000`).
3. Set up a listener for the socket event `record.updated`. When received, run `queryClient.invalidateQueries()`.
4. Wrap `src/app/[locale]/layout.tsx` (inside the existing providers) with `<SocketProvider>`.

### Task 5: Zod Validation Parity
**Instructions for Haiku:**
1. Open `src/app/[locale]/dashboard/products/_schema.ts`.
2. Find the current Zod schemas for products.
3. Enforce strict typing to match the backend: add array structures for `available_addons` (must have `name: string`, `price: number`) and strict data typing for `base_price` (must be a positive number).

### Task 6: Internationalization (i18n) Enforcement
**Instructions for Haiku:**
1. Open `src/app/[locale]/dashboard/products/page.tsx`.
2. Replace the hardcoded English text (e.g. `<h1>Product Catalog</h1>`, `No products found`, `New Product`) with the `useTranslations('products')` hook.
3. Open `messages/en.json` and add the matching translation keys under a new `"products"` parent key.
