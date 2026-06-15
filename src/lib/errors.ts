import { FunctionsHttpError, type FunctionInvokeOptions, type SupabaseClient } from '@supabase/supabase-js'

const GENERIC_EDGE_FUNCTION_MESSAGES = [
  'edge function returned a non-2xx status code',
  'failed to send a request to the edge function',
]

function isGenericEdgeFunctionMessage(message: string): boolean {
  const lower = message.toLowerCase()
  return GENERIC_EDGE_FUNCTION_MESSAGES.some((generic) => lower.includes(generic))
}

interface PostgrestErrorLike {
  message?: string
  details?: string | null
  hint?: string | null
  code?: string
}

/**
 * Extracts a user-facing message from a JSON response body (edge functions, fetch, RPC payloads).
 */
export function extractResponseMessage(body: unknown): string | null {
  if (!body) return null

  if (typeof body === 'string') {
    const trimmed = body.trim()
    return trimmed || null
  }

  if (typeof body !== 'object') return null

  const record = body as Record<string, unknown>

  if (typeof record.error === 'string') return record.error

  if (record.error && typeof record.error === 'object') {
    const nested = record.error as Record<string, unknown>
    if (typeof nested.message === 'string') return nested.message
  }

  if (typeof record.message === 'string') return record.message

  return null
}

/** @deprecated Use extractResponseMessage */
export const extractEdgeFunctionResponseMessage = extractResponseMessage

async function readResponseBody(context: unknown): Promise<unknown> {
  if (context instanceof Response) {
    const contentType = context.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      try {
        return await context.json()
      } catch {
        return null
      }
    }

    try {
      const text = await context.text()
      if (!text) return null

      try {
        return JSON.parse(text)
      } catch {
        return text
      }
    } catch {
      return null
    }
  }

  if (typeof context === 'object' && context !== null) {
    return context
  }

  return null
}

function getEdgeFunctionContext(error: unknown): unknown {
  if (error instanceof FunctionsHttpError) return error.context
  if (typeof error === 'object' && error !== null && 'context' in error) {
    return (error as { context: unknown }).context
  }
  return null
}

/**
 * Resolves a user-facing message from a Supabase PostgREST / RPC / auth error.
 */
export function getSupabaseErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (!error) return fallback

  if (typeof error === 'object' && error !== null) {
    const record = error as PostgrestErrorLike

    if (typeof record.message === 'string' && record.message.trim()) {
      if (!isGenericEdgeFunctionMessage(record.message)) {
        return record.message
      }
    }

    if (typeof record.details === 'string' && record.details.trim()) {
      return record.details
    }
  }

  if (error instanceof Error && error.message.trim()) {
    if (!isGenericEdgeFunctionMessage(error.message)) {
      return error.message
    }
  }

  return fallback
}

/**
 * Resolves a user-facing message from a Supabase edge function invoke error.
 * Non-2xx responses only expose a generic message unless the response body is parsed.
 */
export async function getEdgeFunctionErrorMessage(
  error: unknown,
  fallback = 'Something went wrong'
): Promise<string> {
  if (!error) return fallback

  const errorMessage = error instanceof Error ? error.message : String(error)

  if (errorMessage.includes('JWT') || errorMessage.includes('401')) {
    return 'Session expired. Please refresh the page and log in again.'
  }

  const context = getEdgeFunctionContext(error)
  if (context) {
    const body = await readResponseBody(context)
    const extracted = extractResponseMessage(body)
    if (extracted) return extracted
  }

  if (errorMessage) {
    try {
      const parsed = JSON.parse(errorMessage)
      const extracted = extractResponseMessage(parsed)
      if (extracted) return extracted
    } catch {
      // Not JSON
    }

    if (!isGenericEdgeFunctionMessage(errorMessage)) {
      return errorMessage
    }
  }

  return fallback
}

/**
 * Resolves a user-facing message from any error (edge functions, Supabase, fetch, Error).
 */
export async function resolveErrorMessage(
  error: unknown,
  fallback = 'Something went wrong'
): Promise<string> {
  if (!error) return fallback

  const edgeContext = getEdgeFunctionContext(error)
  if (edgeContext) {
    const body = await readResponseBody(edgeContext)
    const extracted = extractResponseMessage(body)
    if (extracted) return extracted
  }

  const supabaseMessage = getSupabaseErrorMessage(error, '')
  if (supabaseMessage) return supabaseMessage

  return fallback
}

/**
 * Parses an error message from a non-OK fetch Response (e.g. direct edge function calls).
 */
export async function getFetchErrorMessage(
  response: Response,
  fallback = 'Something went wrong'
): Promise<string> {
  try {
    const body = await readResponseBody(response)
    const extracted = extractResponseMessage(body)
    if (extracted) return extracted
  } catch {
    // Fall through to fallback
  }

  return fallback
}

type InvokeResult<T> = { data: T | null; error: unknown }

/**
 * Invokes a Supabase edge function and throws with a parsed error message on failure.
 */
export async function invokeEdgeFunction<T>(
  client: SupabaseClient,
  functionName: string,
  options?: FunctionInvokeOptions,
  fallbackError = 'Request failed'
): Promise<T> {
  const { data, error } = (await client.functions.invoke(functionName, options)) as InvokeResult<T>

  if (error) {
    throw new Error(await getEdgeFunctionErrorMessage(error, fallbackError))
  }

  if (data && typeof data === 'object' && 'success' in data && (data as { success: boolean }).success === false) {
    const message = extractResponseMessage(data)
    if (message) throw new Error(message)
  }

  return data as T
}
