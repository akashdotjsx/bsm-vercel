"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState } from "react"

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data stays fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cache data for 30 minutes (increased for better performance)
            gcTime: 30 * 60 * 1000,
            // Retry failed requests once
            retry: 1,
            // DISABLE automatic refetch on window focus (prevents unwanted refreshes)
            refetchOnWindowFocus: false,
            // DISABLE refetch on mount if data exists (prevents re-renders)
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
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
      )}
    </QueryClientProvider>
  )
}
