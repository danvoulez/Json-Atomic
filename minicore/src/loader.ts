/**
 * Span loader - Load spans from various sources
 * Browser and edge runtime compatible
 */

import { validateSpan, createSpan } from './validator.ts'
import type { Span, LoaderOptions } from './types.ts'

/**
 * Load span from a JavaScript object
 * 
 * @param obj - Object to load as span
 * @param options - Loader options
 * @returns Valid span
 * @throws Error if validation fails
 */
export function loadFromObject(obj: unknown, options: LoaderOptions = {}): Span {
  const shouldValidate = options.validate !== false
  
  if (shouldValidate) {
    const validation = validateSpan(obj)
    if (!validation.valid) {
      throw new Error(`Invalid span: ${validation.errors?.join(', ')}`)
    }
  }
  
  return createSpan(obj as Partial<Span>)
}

/**
 * Load span from JSON string
 * 
 * @param json - JSON string
 * @param options - Loader options
 * @returns Valid span
 * @throws Error if parsing or validation fails
 */
export function loadFromJSON(json: string, options: LoaderOptions = {}): Span {
  try {
    const obj = JSON.parse(json)
    return loadFromObject(obj, options)
  } catch (err) {
    throw new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * Load spans from NDJSON string
 * 
 * @param ndjson - NDJSON string (newline-delimited JSON)
 * @param options - Loader options
 * @returns Array of valid spans
 * @throws Error if parsing or validation fails
 */
export function loadFromNDJSON(ndjson: string, options: LoaderOptions = {}): Span[] {
  const lines = ndjson.trim().split('\n').filter(line => line.trim())
  const spans: Span[] = []
  
  for (let i = 0; i < lines.length; i++) {
    try {
      const span = loadFromJSON(lines[i], options)
      spans.push(span)
    } catch (err) {
      throw new Error(`Failed to parse NDJSON line ${i + 1}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  
  return spans
}

/**
 * Load span from a URL (fetch)
 * Note: Requires fetch API (available in browsers, Deno, and modern Node.js)
 * 
 * @param url - URL to fetch
 * @param options - Loader options
 * @returns Valid span or array of spans (if NDJSON)
 * @throws Error if fetch or parsing fails
 */
export async function loadFromURL(
  url: string,
  options: LoaderOptions = {}
): Promise<Span | Span[]> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const text = await response.text()
    
    if (options.ndjson) {
      return loadFromNDJSON(text, options)
    } else {
      return loadFromJSON(text, options)
    }
  } catch (err) {
    throw new Error(`Failed to load from URL: ${err instanceof Error ? err.message : String(err)}`)
  }
}

/**
 * Load span from a file path
 * Note: This requires file system access (Deno.readTextFile or Node fs)
 * Not available in browsers
 * 
 * @param path - File path
 * @param options - Loader options
 * @returns Valid span or array of spans (if NDJSON)
 * @throws Error if file read or parsing fails
 */
export async function loadFromFile(
  path: string,
  options: LoaderOptions = {}
): Promise<Span | Span[]> {
  try {
    // Try Deno first
    if (typeof Deno !== 'undefined' && Deno.readTextFile) {
      const text = await Deno.readTextFile(path)
      
      if (options.ndjson || path.endsWith('.ndjson')) {
        return loadFromNDJSON(text, options)
      } else {
        return loadFromJSON(text, options)
      }
    }
    
    // Fallback error for non-Deno environments
    throw new Error('File system access not available in this environment')
  } catch (err) {
    throw new Error(`Failed to load from file: ${err instanceof Error ? err.message : String(err)}`)
  }
}
