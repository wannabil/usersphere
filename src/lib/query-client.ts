import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    // Time until data is considered stale
    staleTime: 1000 * 60 * 5, // 5 minutes
    
    // Time until inactive queries are garbage collected
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    
    // Retry failed requests once
    retry: 1,
    
    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Don't refetch on window focus (can be enabled per-query)
    refetchOnWindowFocus: false,
    
    // Refetch on reconnect
    refetchOnReconnect: true,
    
    // Refetch on mount if data is stale
    refetchOnMount: true,
  },
  mutations: {
    // Don't retry mutations (user should retry manually)
    retry: 0,
    
    // Network mode: fail fast on offline
    networkMode: 'online',
  },
};

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: queryConfig,
  });
}

// Browser client (singleton)
let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

