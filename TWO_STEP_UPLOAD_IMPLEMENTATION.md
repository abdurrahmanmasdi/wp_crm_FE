# Two-Step Sequential Upload Implementation

## Overview

This document describes the implementation of the two-step sequential upload pattern for the CreateProductForm component. The pattern separates JSON product data submission from binary file uploads.

## Architecture

### Step 1: JSON Product Creation

- Send product metadata (title, price, specifications, etc.) without media files
- Endpoint: `POST /api/v1/organizations/:organizationId/products`
- Payload: `CreateProductDto` (excludes media)
- Response: Returns created product with `id`

### Step 2: Conditional Media Upload

- If files are selected, upload them as multipart/form-data
- Endpoint: `POST /api/v1/organizations/:organizationId/products/:productId/media/upload`
- Payload: FormData with 'files' entries
- Response: Array of uploaded ProductMedia objects

## Implementation Details

### 1. File State Management (Component Level)

**Location:** `CreateProductForm.tsx`

```typescript
// Gallery state is kept outside react-hook-form (File objects aren't serializable)
const [mediaItems, setMediaItems] = useState<LocalMediaItem[]>(initialMedia);
```

- Files are managed separately from React Hook Form (which only handles JSON-serializable data)
- ProductGallery component handles drag & drop and file selection
- `LocalMediaItem` type contains: `{ file: File; previewUrl: string; isPrimary: boolean }`

### 2. Updated `buildPayload()` Function

**Location:** `CreateProductForm.tsx` (lines 66-102)

**Changes:**

- Removed media mapping logic
- Function signature changed from `buildPayload(data, mediaItems)` to `buildPayload(data)`
- Now returns DTO without media field
- Instances and specifications still included as before

```typescript
function buildPayload(data: ProductFormValues): CreateProductDto {
  // ... processes specs and instances only
  return {
    type: data.type,
    title: data.title,
    description: data.description,
    base_price: data.base_price,
    currency: data.currency,
    specifications,
    available_addons: data.available_addons,
    instances: instances.length > 0 ? instances : undefined,
    // Note: NO media field
  };
}
```

### 3. Two-Step Submission Handler (`onSubmit`)

**Location:** `CreateProductForm.tsx` (lines 213-280)

**Flow:**

1. **Validation**: Check if organization is selected
2. **Step 1 - JSON Submission**:
   - Build payload from form data (no files)
   - Call `productService.create()` or `productService.update()`
   - Extract product ID from response
3. **Step 2 - Conditional File Upload**:
   - Check if `mediaItems.length > 0`
   - Create FormData and append each file: `formData.append('files', file)`
   - Call `productService.uploadMedia()`
   - Catch upload errors separately
4. **Error Handling - Edge Case**:
   - If Step 1 succeeds but Step 2 fails:
     - Show warning toast: "Product created, but images failed to upload..."
     - Still redirect to catalog (don't block user)
5. **Success & Redirect**:
   - Show appropriate success toast
   - Invalidate React Query caches
   - Redirect to `/products` catalog

### 4. New Service Method: `uploadMedia()`

**Location:** `src/lib/product.service.ts` (lines 156-175)

```typescript
uploadMedia(
  organizationId: string,
  productId: string,
  formData: FormData
): Promise<{ files: ProductMedia[] }> {
  return api
    .post<{ files: ProductMedia[] }>(
      `/organizations/${organizationId}/products/${productId}/media/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    .then((r) => r.data);
}
```

**Key Points:**

- Accepts FormData object with 'files' entries
- Explicitly sets `Content-Type: multipart/form-data`
- Returns array of uploaded ProductMedia objects

## Loading State Management

The submit button already displays loading state via `form.formState.isSubmitting`:

```typescript
<button
  type="submit"
  disabled={isSubmitting}
  className="..."
>
  {isSubmitting ? (
    <>
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      {isEditMode ? 'Saving…' : 'Publishing…'}
    </>
  ) : isEditMode ? (
    'Save Changes'
  ) : (
    'Activate & List Product'
  )}
</button>
```

Prevents duplicate submissions automatically during the entire two-step flow.

## Toast Notifications

Using `sonner` library for user feedback:

| Scenario                     | Toast Type | Message                                                                               |
| ---------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| No organization selected     | error      | "Please select an organization before managing products."                             |
| JSON submission fails        | error      | Extracted error message                                                               |
| JSON succeeds, files fail    | warning    | "Product created, but images failed to upload. Please edit the product to try again." |
| Everything succeeds (create) | success    | "Product created successfully!"                                                       |
| Everything succeeds (update) | success    | "Product updated successfully!"                                                       |

## React Query Cache Invalidation

After successful submission:

- Invalidates `queryKeys.products.all(organizationId)` - refreshes product list
- For edit mode: Also invalidates `queryKeys.products.detail(organizationId, productId)` - refreshes specific product

## Error Handling Strategy

- **Step 1 Errors**: Throw and catch - show error toast and stop
- **Step 2 Errors**: Catch separately - show warning but continue to redirect
- All errors logged to console for debugging
- No error rollback: Product is created even if media upload fails (by design per requirements)

## Supported File Types

Files are filtered at the UI level in ProductGallery:

```html
<input accept="image/*" multiple />
```

Supports: JPG, PNG, WebP (as specified in gallery UI)

## Edit Mode Behavior

The same two-step flow applies when editing:

1. PATCH product JSON to update metadata
2. If new files added, upload them sequentially
3. Existing media remains unchanged (separate edit flow)

## Testing Checklist

- [ ] Create product without files → redirects to catalog
- [ ] Create product with one file → both steps succeed
- [ ] Create product with multiple files → all files uploaded
- [ ] Create product with files, step 2 fails → warning toast + redirect
- [ ] Edit product, add files → files uploaded successfully
- [ ] Edit product without files → no upload step triggered
- [ ] Network error on step 1 → error toast, no redirect
- [ ] Network error on step 2 → warning toast, still redirect
- [ ] UI prevents duplicate submissions while loading

## Browser Compatibility

- FormData API: All modern browsers
- File API: All modern browsers
- Drag & drop: All modern browsers
- sonner toast library: Supports all modern browsers

## Performance Notes

- Sequential upload (not parallel) respects server request ordering
- FormData doesn't buffer entire files in memory
- File objects referenced by preview URLs until upload completes
- No unnecessary re-renders due to file state isolation
