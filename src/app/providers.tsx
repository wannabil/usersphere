'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query-client';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { useMutationQueue } from '@/lib/hooks/use-mutation-queue';

function MutationQueueProcessor() {
  useMutationQueue();
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient instance for each request
  // This ensures that data is not shared between users
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <MutationQueueProcessor />
      {children}
      <Toaster
        position="top-right"
        richColors
        expand={false}
        duration={4000}
        closeButton
        toastOptions={{
          classNames: {
            toast: 'group toast',
            title: 'font-semibold',
            description: 'text-sm opacity-90',
            actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
            cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

