'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Capture the error in Sentry
    Sentry.captureException(error, {
      tags: {
        location: 'dashboard',
        component: 'error-boundary',
      },
      level: 'error',
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Dashboard error caught:', error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-950">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Something went wrong
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            An unexpected error occurred while loading the dashboard. Our team
            has been notified and is looking into it.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="space-y-2 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Error Details (Development Only):
            </p>
            <p className="font-mono text-xs text-red-600 dark:text-red-400">
              {error.message}
            </p>
            {error.digest && (
              <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={reset}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = '/dashboard')}
            variant="outline"
            className="flex-1"
          >
            Go to dashboard
          </Button>
        </div>

        <p className="text-center text-xs text-slate-500 dark:text-slate-500">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
