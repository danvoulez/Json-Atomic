/**
 * Ledger Viewer UI Component
 * Displays, filters, and manages execution ledger with NDJSON support
 *
 * @module
 */

import type { ExecutionResult } from '../types.ts'
import { verifySingleSpan, verifyLedger } from '../verifyLedger.ts'
import { createElement, button, input, toast, formatTime } from './ui-utils.ts'

/**
 * Ledger filter options
 */
export interface LedgerFilter {
  status?: 'ok' | 'error'
  kernel?: string
  policy?: string
  search?: string
}

/**
 * Ledger Viewer component
 * Manages ledger display, filtering, and operations
 */
export class LedgerViewer {
  private container: HTMLElement
  private ledger: ExecutionResult[] = []
  private filteredLedger: ExecutionResult[] = []
  private filter: LedgerFilter = {}
  private pageSize = 50
  private currentPage = 0
  private onReplay?: (span: ExecutionResult) => void

  constructor(container: HTMLElement, onReplay?: (span: ExecutionResult) => void) {
    this.container = container
    this.onReplay = onReplay
    this.render()
  }

  /**
   * Set ledger data
   */
  setLedger(ledger: ExecutionResult[]): void {
    this.ledger = ledger
    this.applyFilter()
    this.render()
  }

  /**
   * Add span to ledger
   */
  addSpan(span: ExecutionResult): void {
    this.ledger.push(span)
    this.applyFilter()
    this.render()
  }

  /**
   * Clear ledger
   */
  clear(): void {
    if (!confirm('Clear all ledger entries?')) return
    this.ledger = []
    this.filteredLedger = []
    this.currentPage = 0
    this.render()
    toast('Ledger cleared', 'info')
  }

  /**
   * Apply current filter to ledger
   */
  private applyFilter(): void {
    this.filteredLedger = this.ledger.filter((span) => {
      if (this.filter.status && span.status !== this.filter.status) {
        return false
      }

      if (this.filter.kernel && span.kind !== this.filter.kernel) {
        return false
      }

      if (
        this.filter.policy &&
        !span.policy_applied?.includes(this.filter.policy)
      ) {
        return false
      }

      if (this.filter.search) {
        const searchLower = this.filter.search.toLowerCase()
        const spanStr = JSON.stringify(span).toLowerCase()
        if (!spanStr.includes(searchLower)) {
          return false
        }
      }

      return true
    })

    this.currentPage = 0
  }

  /**
   * Render the Ledger Viewer UI
   */
  private render(): void {
    this.container.innerHTML = ''
    this.container.className = 'ledger-viewer'

    // Header with actions
    const header = createElement('div', { className: 'ledger-header' })

    header.appendChild(createElement('h2', {}, 'Execution Ledger'))

    const stats = createElement(
      'div',
      { className: 'ledger-stats' },
      `Total: ${this.ledger.length} | Filtered: ${this.filteredLedger.length}`
    )
    header.appendChild(stats)

    const actions = createElement('div', { className: 'ledger-actions' })
    actions.appendChild(button('Import NDJSON', () => this.importNDJSON(), 'btn-secondary'))
    actions.appendChild(button('Export NDJSON', () => this.exportNDJSON(), 'btn-secondary'))
    actions.appendChild(button('Verify All', () => this.verifyAll(), 'btn-secondary'))
    actions.appendChild(button('Clear', () => this.clear(), 'btn-danger'))
    header.appendChild(actions)

    this.container.appendChild(header)

    // Filters
    this.container.appendChild(this.renderFilters())

    // Ledger table
    this.container.appendChild(this.renderLedgerTable())

    // Pagination
    if (this.filteredLedger.length > this.pageSize) {
      this.container.appendChild(this.renderPagination())
    }
  }

  /**
   * Render filter controls
   */
  private renderFilters(): HTMLElement {
    const filters = createElement('div', { className: 'ledger-filters' })

    // Search
    filters.appendChild(
      input(
        'text',
        this.filter.search || '',
        (value) => {
          this.filter.search = value
          this.applyFilter()
          this.render()
        },
        { placeholder: 'Search ledger...', className: 'search-input' }
      )
    )

    // Status filter
    const statusSelect = createElement('select', { className: 'filter-select' })
    statusSelect.appendChild(createElement('option', { value: '' }, 'All Status'))
    statusSelect.appendChild(createElement('option', { value: 'ok' }, 'OK'))
    statusSelect.appendChild(createElement('option', { value: 'error' }, 'Error'))
    if (this.filter.status) {
      ;(statusSelect.querySelector(`option[value="${this.filter.status}"]`) as HTMLOptionElement).selected = true
    }
    statusSelect.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value
      this.filter.status = value ? (value as 'ok' | 'error') : undefined
      this.applyFilter()
      this.render()
    })
    filters.appendChild(statusSelect)

    // Kernel filter
    const kernels = [...new Set(this.ledger.map((s) => s.kind).filter(Boolean))]
    if (kernels.length > 0) {
      const kernelSelect = createElement('select', { className: 'filter-select' })
      kernelSelect.appendChild(createElement('option', { value: '' }, 'All Kernels'))
      for (const kernel of kernels) {
        kernelSelect.appendChild(createElement('option', { value: kernel! }, kernel!))
      }
      if (this.filter.kernel) {
        ;(kernelSelect.querySelector(`option[value="${this.filter.kernel}"]`) as HTMLOptionElement).selected = true
      }
      kernelSelect.addEventListener('change', (e) => {
        const value = (e.target as HTMLSelectElement).value
        this.filter.kernel = value || undefined
        this.applyFilter()
        this.render()
      })
      filters.appendChild(kernelSelect)
    }

    // Reset filters
    filters.appendChild(
      button(
        'Reset',
        () => {
          this.filter = {}
          this.applyFilter()
          this.render()
        },
        'btn-small'
      )
    )

    return filters
  }

  /**
   * Render ledger table with virtualization
   */
  private renderLedgerTable(): HTMLElement {
    const tableContainer = createElement('div', { className: 'ledger-table-container' })

    if (this.filteredLedger.length === 0) {
      tableContainer.appendChild(
        createElement(
          'div',
          { className: 'empty-state' },
          'No spans in ledger. Execute some spans to see them here.'
        )
      )
      return tableContainer
    }

    const table = createElement('table', { className: 'ledger-table' })

    // Header
    const thead = createElement('thead')
    const headerRow = createElement('tr')
    const headers = ['#', 'Status', 'Kernel', 'Duration', 'Policies', 'Hash', 'Actions']
    for (const header of headers) {
      headerRow.appendChild(createElement('th', {}, header))
    }
    thead.appendChild(headerRow)
    table.appendChild(thead)

    // Body - paginated
    const tbody = createElement('tbody')
    const start = this.currentPage * this.pageSize
    const end = Math.min(start + this.pageSize, this.filteredLedger.length)

    for (let i = start; i < end; i++) {
      const span = this.filteredLedger[i]
      const row = createElement('tr', {
        className: span.status === 'error' ? 'row-error' : ''
      })

      // Index
      row.appendChild(createElement('td', {}, String(i + 1)))

      // Status
      const statusBadge = createElement(
        'td',
        {},
        createElement(
          'span',
          { className: `badge badge-${span.status}` },
          span.status.toUpperCase()
        )
      )
      row.appendChild(statusBadge)

      // Kernel
      row.appendChild(createElement('td', {}, span.kind || '-'))

      // Duration
      row.appendChild(createElement('td', {}, formatTime(span.duration_ms)))

      // Policies
      const policies = span.policy_applied?.join(', ') || 'none'
      row.appendChild(createElement('td', { className: 'policies-cell' }, policies))

      // Hash
      const hashCell = createElement('td', { className: 'hash-cell' })
      const hashShort = span.hash.slice(0, 8) + '...'
      const hashSpan = createElement('code', { title: span.hash }, hashShort)
      hashCell.appendChild(hashSpan)
      row.appendChild(hashCell)

      // Actions
      const actionsCell = createElement('td', { className: 'actions-cell' })
      actionsCell.appendChild(
        button('View', () => this.viewSpan(span), 'btn-tiny')
      )
      if (this.onReplay) {
        actionsCell.appendChild(
          button('Replay', () => this.onReplay!(span), 'btn-tiny')
        )
      }
      actionsCell.appendChild(
        button('Verify', () => this.verifySpan(span), 'btn-tiny')
      )
      row.appendChild(actionsCell)

      tbody.appendChild(row)
    }

    table.appendChild(tbody)
    tableContainer.appendChild(table)

    return tableContainer
  }

  /**
   * Render pagination controls
   */
  private renderPagination(): HTMLElement {
    const pagination = createElement('div', { className: 'ledger-pagination' })

    const totalPages = Math.ceil(this.filteredLedger.length / this.pageSize)

    pagination.appendChild(
      button(
        'Previous',
        () => {
          if (this.currentPage > 0) {
            this.currentPage--
            this.render()
          }
        },
        this.currentPage === 0 ? 'btn-disabled' : ''
      )
    )

    pagination.appendChild(
      createElement(
        'span',
        { className: 'page-info' },
        `Page ${this.currentPage + 1} of ${totalPages}`
      )
    )

    pagination.appendChild(
      button(
        'Next',
        () => {
          if (this.currentPage < totalPages - 1) {
            this.currentPage++
            this.render()
          }
        },
        this.currentPage >= totalPages - 1 ? 'btn-disabled' : ''
      )
    )

    return pagination
  }

  /**
   * Import NDJSON file
   */
  private async importNDJSON(): Promise<void> {
    const input = createElement('input', { type: 'file', accept: '.ndjson,.jsonl' }) as HTMLInputElement
    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const lines = text.split('\n').filter((line) => line.trim())
        const spans: ExecutionResult[] = []

        for (const line of lines) {
          try {
            const span = JSON.parse(line)
            spans.push(span)
          } catch {
            // Skip invalid lines
          }
        }

        this.ledger = [...this.ledger, ...spans]
        this.applyFilter()
        this.render()
        toast(`Imported ${spans.length} spans from ${file.name}`, 'success')
      } catch (err) {
        toast('Failed to import NDJSON: ' + (err as Error).message, 'error')
      }
    })

    input.click()
  }

  /**
   * Export ledger as NDJSON
   */
  private exportNDJSON(): void {
    if (this.ledger.length === 0) {
      toast('Ledger is empty', 'error')
      return
    }

    // Create metadata header
    const metadata = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      total_spans: this.ledger.length,
      env_fingerprint: this.ledger[0].meta?.env_fingerprint || 'unknown'
    }

    // Generate NDJSON with metadata header
    const lines = [
      `# Minicore Ledger Export - ${metadata.timestamp}`,
      `# Total spans: ${metadata.total_spans}`,
      ...this.ledger.map((span) => JSON.stringify(span))
    ]

    const ndjson = lines.join('\n') + '\n'

    // Download
    const blob = new Blob([ndjson], { type: 'application/x-ndjson' })
    const url = URL.createObjectURL(blob)
    const a = createElement('a', {
      href: url,
      download: `minicore-ledger-${Date.now()}.ndjson`
    })
    a.click()
    URL.revokeObjectURL(url)

    toast(`Exported ${this.ledger.length} spans`, 'success')
  }

  /**
   * Verify all spans in ledger
   */
  private async verifyAll(): Promise<void> {
    if (this.ledger.length === 0) {
      toast('Ledger is empty', 'error')
      return
    }

    try {
      const report = await verifyLedger(this.ledger)

      // Show modal with report
      const modal = this.createModal('Verification Report')
      const body = modal.querySelector('.modal-body')!

      // Summary
      body.appendChild(
        createElement(
          'div',
          { className: 'verification-summary' },
          createElement('p', {}, `Total spans: ${report.total}`),
          createElement('p', {}, `Valid: ${report.valid}`),
          createElement('p', {}, `Invalid: ${report.invalid}`),
          createElement('p', {}, `Chain valid: ${report.chain_valid ? 'Yes' : 'No'}`)
        )
      )

      // Errors
      if (report.errors.length > 0) {
        body.appendChild(createElement('h4', {}, 'Errors:'))
        const errorList = createElement('ul', { className: 'error-list' })
        for (const error of report.errors) {
          errorList.appendChild(
            createElement('li', { className: 'error-item' }, error)
          )
        }
        body.appendChild(errorList)
      }

      // Export buttons
      const actions = createElement('div', { className: 'modal-actions' })
      actions.appendChild(
        button('Copy as JSON', () => {
          navigator.clipboard.writeText(JSON.stringify(report, null, 2))
          toast('Report copied to clipboard', 'success')
        })
      )
      actions.appendChild(
        button('Copy as Text', () => {
          const text = `Verification Report\n\nTotal: ${report.total}\nValid: ${report.valid}\nInvalid: ${report.invalid}\nChain Valid: ${report.chain_valid}\n\nErrors:\n${report.errors.join('\n')}`
          navigator.clipboard.writeText(text)
          toast('Report copied to clipboard', 'success')
        })
      )
      body.appendChild(actions)

      document.body.appendChild(modal)
    } catch (err) {
      toast('Verification failed: ' + (err as Error).message, 'error')
    }
  }

  /**
   * Verify single span
   */
  private async verifySpan(span: ExecutionResult): Promise<void> {
    try {
      const result = await verifySingleSpan(span)

      if (result.valid) {
        toast('Span verification passed ✓', 'success')
      } else {
        toast(`Verification failed: ${result.errors?.join(', ')}`, 'error')
      }
    } catch (err) {
      toast('Verification error: ' + (err as Error).message, 'error')
    }
  }

  /**
   * View span details in modal
   */
  private viewSpan(span: ExecutionResult): void {
    const modal = this.createModal(`Span Details - ${span.kind}`)
    const body = modal.querySelector('.modal-body')!

    // Span JSON
    const pre = createElement('pre', { className: 'span-json' })
    pre.textContent = JSON.stringify(span, null, 2)
    body.appendChild(pre)

    // Copy button
    body.appendChild(
      button('Copy JSON', () => {
        navigator.clipboard.writeText(JSON.stringify(span, null, 2))
        toast('Span copied to clipboard', 'success')
      })
    )

    document.body.appendChild(modal)
  }

  /**
   * Create modal dialog
   */
  private createModal(title: string): HTMLElement {
    const overlay = createElement('div', { className: 'modal-overlay' })
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove()
      }
    })

    const modal = createElement('div', { className: 'modal' })
    const header = createElement('div', { className: 'modal-header' })
    header.appendChild(createElement('h3', {}, title))
    header.appendChild(
      button('×', () => overlay.remove(), 'btn-close')
    )

    modal.appendChild(header)
    modal.appendChild(createElement('div', { className: 'modal-body' }))

    overlay.appendChild(modal)
    return overlay
  }

  /**
   * Get current ledger
   */
  getLedger(): ExecutionResult[] {
    return [...this.ledger]
  }
}
