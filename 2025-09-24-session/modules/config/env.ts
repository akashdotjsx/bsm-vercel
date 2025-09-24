import { z } from "zod"

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid SUPABASE URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(10, "Missing anon key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10, "Missing service role key"),
})

type Env = z.infer<typeof EnvSchema>

let cached: Env | null = null

export function loadEnv(): Env {
  if (cached) return cached
  const parsed = EnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })

  if (!parsed.success) {
    const msg = parsed.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
    // In production we should throw to avoid undefined behavior
    throw new Error(`[env] Invalid environment configuration: ${msg}`)
  }

  cached = parsed.data
  return cached
}

export const env = loadEnv()
