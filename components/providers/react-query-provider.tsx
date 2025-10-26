"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // ✅ Data stays fresh for 5 minutes (optimized for instant navigation)
            staleTime: 5 * 60 * 1000,
            // ✅ Cache data for 15 minutes before garbage collection
            gcTime: 15 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // ✅ DISABLE automatic refetch on window focus (prevents unwanted refreshes)
            refetchOnWindowFocus: false,
            // ✅ DISABLE refetch on mount if data exists (KEY: prevents re-renders on navigation)
            refetchOnMount: false,
            // DISABLE refetch on reconnect (prevents unnecessary network calls)
            refetchOnReconnect: false,
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
