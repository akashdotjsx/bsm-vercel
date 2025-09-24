type GraphQLRequestOptions = {
  accessToken?: string
  headers?: Record<string, string>
}

export async function gql<T = any>(query: string, variables?: Record<string, any>, options: GraphQLRequestOptions = {}): Promise<T> {
  const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ...options.headers,
  }
  if (options.accessToken) headers['Authorization'] = `Bearer ${options.accessToken}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`GraphQL HTTP error ${res.status}: ${text}`)
  }

  const json = (await res.json()) as { data?: T; errors?: any[] }
  if (json.errors && json.errors.length) {
    const msg = json.errors.map((e) => e.message || JSON.stringify(e)).join('; ')
    throw new Error(`GraphQL error(s): ${msg}`)
  }

  return json.data as T
}
