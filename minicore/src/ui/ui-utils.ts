/**
 * UI utilities for creating DOM elements without frameworks
 * Lightweight helpers for building interactive interfaces
 *
 * @module
 */

/**
 * Create a DOM element with attributes and children
 *
 * @param tag - HTML tag name
 * @param attrs - Element attributes
 * @param children - Child elements or text
 * @returns Created element
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number | boolean> = {},
  ...children: (HTMLElement | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)

  // Set attributes
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = String(value)
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value)
    } else if (key.startsWith('on') && typeof value === 'function') {
      const eventName = key.slice(2).toLowerCase()
      el.addEventListener(eventName, value as EventListener)
    } else {
      el.setAttribute(key, String(value))
    }
  }

  // Append children
  for (const child of children) {
    if (child === null || child === undefined) continue
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child))
    } else {
      el.appendChild(child)
    }
  }

  return el
}

/**
 * Create a button element
 */
export function button(
  text: string,
  onClick: () => void,
  className = ''
): HTMLButtonElement {
  const btn = createElement('button', { className }, text)
  btn.addEventListener('click', onClick)
  return btn
}

/**
 * Create an input element
 */
export function input(
  type: string,
  value: string,
  onChange?: (value: string) => void,
  attrs: Record<string, string | number> = {}
): HTMLInputElement {
  const inp = createElement('input', { type, value, ...attrs })
  if (onChange) {
    inp.addEventListener('input', (e) => onChange((e.target as HTMLInputElement).value))
  }
  return inp
}

/**
 * Create a label with input
 */
export function labeledInput(
  label: string,
  type: string,
  value: string,
  onChange?: (value: string) => void,
  attrs: Record<string, string | number> = {}
): HTMLDivElement {
  return createElement(
    'div',
    { className: 'form-group' },
    createElement('label', {}, label),
    input(type, value, onChange, attrs)
  )
}

/**
 * Create a select dropdown
 */
export function select(
  options: Array<{ value: string; label: string }>,
  selected: string,
  onChange?: (value: string) => void,
  attrs: Record<string, string> = {}
): HTMLSelectElement {
  const sel = createElement('select', attrs)

  for (const opt of options) {
    const optEl = createElement('option', { value: opt.value }, opt.label)
    if (opt.value === selected) {
      optEl.selected = true
    }
    sel.appendChild(optEl)
  }

  if (onChange) {
    sel.addEventListener('change', (e) =>
      onChange((e.target as HTMLSelectElement).value)
    )
  }

  return sel
}

/**
 * Create a card container
 */
export function card(
  title: string,
  ...children: HTMLElement[]
): HTMLDivElement {
  return createElement(
    'div',
    { className: 'card' },
    createElement('div', { className: 'card-header' }, title),
    createElement('div', { className: 'card-body' }, ...children)
  )
}

/**
 * Show a toast notification
 */
export function toast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration = 3000
): void {
  const toast = createElement(
    'div',
    { className: `toast toast-${type}` },
    message
  )

  document.body.appendChild(toast)

  // Animate in
  setTimeout(() => toast.classList.add('show'), 10)

  // Remove after duration
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, duration)
}

/**
 * Create a table from data
 */
export function table<T extends Record<string, unknown>>(
  data: T[],
  columns: Array<{ key: keyof T; header: string; render?: (value: T[keyof T]) => string }>
): HTMLTableElement {
  const tbl = createElement('table', { className: 'data-table' })

  // Header
  const thead = createElement('thead')
  const headerRow = createElement('tr')
  for (const col of columns) {
    headerRow.appendChild(createElement('th', {}, String(col.header)))
  }
  thead.appendChild(headerRow)
  tbl.appendChild(thead)

  // Body
  const tbody = createElement('tbody')
  for (const row of data) {
    const tr = createElement('tr')
    for (const col of columns) {
      const value = row[col.key]
      const rendered = col.render ? col.render(value) : String(value ?? '')
      tr.appendChild(createElement('td', {}, rendered))
    }
    tbody.appendChild(tr)
  }
  tbl.appendChild(tbody)

  return tbl
}

/**
 * Create a loading spinner
 */
export function spinner(): HTMLDivElement {
  return createElement('div', { className: 'spinner' })
}

/**
 * Format time string (ms, s, m, h)
 */
export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`
  return `${(ms / 3600000).toFixed(1)}h`
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`
}

/**
 * Parse time string to milliseconds
 */
export function parseTime(time: string | number): number {
  if (typeof time === 'number') return time

  const match = time.match(/^(\d+)(ms|s|m|h)?$/)
  if (!match) return 0

  const value = parseInt(match[1])
  const unit = match[2] || 'ms'

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60000,
    h: 3600000
  }

  return value * (multipliers[unit] || 1)
}
