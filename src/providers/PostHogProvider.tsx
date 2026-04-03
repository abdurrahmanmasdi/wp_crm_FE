'use client';

import { PostHogProvider as PostHogProviderBase } from 'posthog-js/react';
import { ReactNode, useEffect } from 'react';
import posthog from 'posthog-js';

interface PostHogProviderProps {
  children: ReactNode;
}

export function PostHogProvider({ children }: PostHogProviderProps) {
  useEffect(() => {
    // Only initialize if not already done (avoid double-init in dev strict mode)
    if (typeof window !== 'undefined' && !posthog.__loaded) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || '', {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_API_HOST ||
          'https://us.i.posthog.com',
        loaded: (ph) => {
          // Only start auto-capture when fully loaded
          if (process.env.NODE_ENV === 'production') {
            ph.startSessionRecording();
          }
        },
      });
    }
  }, []);

  return <PostHogProviderBase client={posthog}>{children}</PostHogProviderBase>;
}
