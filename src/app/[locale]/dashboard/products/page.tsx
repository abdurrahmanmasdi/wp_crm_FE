'use client';

import Link from 'next/link';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProductsPage() {
  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the products and services your organization offers to clients.
          </p>
        </div>
        <Button asChild>
          <Link href="products/create">
            <Plus className="mr-2 h-4 w-4" />
            New Product
          </Link>
        </Button>
      </div>

      {/* Empty state */}
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Package className="h-8 w-8 text-primary opacity-70" />
        </div>
        <div>
          <p className="text-lg font-semibold">No products yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first product to start offering services to your clients.
          </p>
        </div>
        <Button asChild variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
          <Link href="products/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Product
          </Link>
        </Button>
      </div>
    </div>
  );
}
