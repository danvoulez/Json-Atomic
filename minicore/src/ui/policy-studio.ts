/**
 * Policy Studio UI Component
 * Visual interface for configuring, ordering, and simulating policies
 *
 * @module
 */

import {
  getAllPolicies,
  createPolicyConfig,
  simulatePolicy,
  validatePolicyConfig,
  getDefaultPolicyOrder
} from '../policies/registry.ts'
import type { PolicyConfig } from '../types.ts'
import { createElement, button, labeledInput, card, toast } from './ui-utils.ts'

/**
 * Policy profile for saving/loading configurations
 */
export interface PolicyProfile {
  name: string
  config: PolicyConfig
  order: string[]
  description?: string
}

/**
 * Policy Studio state
 */
interface PolicyStudioState {
  config: PolicyConfig
  order: string[]
  profiles: PolicyProfile[]
  simulationResult: any | null
}

/**
 * Policy Studio component
 * Manages policy configuration UI and simulation
 */
export class PolicyStudio {
  private container: HTMLElement
  private state: PolicyStudioState
  private onConfigChange?: (config: PolicyConfig, order: string[]) => void

  constructor(container: HTMLElement, onConfigChange?: (config: PolicyConfig, order: string[]) => void) {
    this.container = container
    this.onConfigChange = onConfigChange
    this.state = {
      config: {},
      order: getDefaultPolicyOrder(),
      profiles: this.loadProfiles(),
      simulationResult: null
    }

    this.render()
  }

  /**
   * Render the Policy Studio UI
   */
  private render(): void {
    this.container.innerHTML = ''
    this.container.className = 'policy-studio'

    // Header
    const header = createElement(
      'div',
      { className: 'studio-header' },
      createElement('h2', {}, 'Policy Studio'),
      createElement('p', {}, 'Configure, order, and simulate execution policies')
    )
    this.container.appendChild(header)

    // Main content - two columns
    const content = createElement('div', { className: 'studio-content' })

    // Left column - Policy Configuration
    const leftCol = createElement('div', { className: 'studio-column' })
    leftCol.appendChild(this.renderPolicyConfig())
    leftCol.appendChild(this.renderPolicyOrder())
    content.appendChild(leftCol)

    // Right column - Simulation & Profiles
    const rightCol = createElement('div', { className: 'studio-column' })
    rightCol.appendChild(this.renderSimulation())
    rightCol.appendChild(this.renderProfiles())
    content.appendChild(rightCol)

    this.container.appendChild(content)
  }

  /**
   * Render policy configuration panel
   */
  private renderPolicyConfig(): HTMLElement {
    const panel = card('Policy Configuration')
    const policies = getAllPolicies()

    for (const policy of policies) {
      const policyCard = createElement('div', { className: 'policy-card' })

      // Policy header
      const header = createElement(
        'div',
        { className: 'policy-header' },
        createElement('strong', {}, policy.name),
        createElement('span', { className: 'policy-description' }, policy.description)
      )
      policyCard.appendChild(header)

      // Policy controls based on type
      const controls = createElement('div', { className: 'policy-controls' })

      if (policy.id === 'ttl' || policy.id === 'slow') {
        // Time-based policies
        const currentValue = this.state.config[policy.id as keyof PolicyConfig] as
          | string
          | undefined
        controls.appendChild(
          labeledInput(
            policy.id === 'ttl' ? 'Time to live' : 'Slow threshold',
            'text',
            currentValue || String(policy.defaultConfig[policy.id]),
            (value) => this.updateConfig(policy.id, value),
            { placeholder: '100ms, 5s, 10m, 2h' }
          )
        )
      } else if (policy.id === 'throttle') {
        // Throttle policy
        const currentValue =
          (this.state.config.throttle as { max_requests: number; window_ms: number }) ||
          policy.defaultConfig.throttle
        const throttleDiv = createElement('div', { className: 'throttle-config' })

        throttleDiv.appendChild(
          labeledInput(
            'Max requests',
            'number',
            String(currentValue.max_requests),
            (value) =>
              this.updateConfig('throttle', {
                ...currentValue,
                max_requests: parseInt(value) || 100
              }),
            { min: '1', step: '1' }
          )
        )

        throttleDiv.appendChild(
          labeledInput(
            'Window (ms)',
            'number',
            String(currentValue.window_ms),
            (value) =>
              this.updateConfig('throttle', {
                ...currentValue,
                window_ms: parseInt(value) || 60000
              }),
            { min: '1000', step: '1000' }
          )
        )

        controls.appendChild(throttleDiv)
      } else if (policy.id === 'circuit_breaker') {
        // Circuit breaker policy
        const currentValue =
          (this.state.config.circuit_breaker as {
            threshold: number
            timeout_ms: number
          }) || policy.defaultConfig.circuit_breaker
        const cbDiv = createElement('div', { className: 'circuit-breaker-config' })

        cbDiv.appendChild(
          labeledInput(
            'Failure threshold',
            'number',
            String(currentValue.threshold),
            (value) =>
              this.updateConfig('circuit_breaker', {
                ...currentValue,
                threshold: parseInt(value) || 5
              }),
            { min: '1', step: '1' }
          )
        )

        cbDiv.appendChild(
          labeledInput(
            'Timeout (ms)',
            'number',
            String(currentValue.timeout_ms),
            (value) =>
              this.updateConfig('circuit_breaker', {
                ...currentValue,
                timeout_ms: parseInt(value) || 30000
              }),
            { min: '1000', step: '1000' }
          )
        )

        controls.appendChild(cbDiv)
      }

      // Enable/disable toggle
      const enabled = this.state.config[policy.id as keyof PolicyConfig] !== undefined
      const toggle = createElement('label', { className: 'toggle-label' })
      const checkbox = createElement('input', { type: 'checkbox' }) as HTMLInputElement
      checkbox.checked = enabled
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          this.updateConfig(policy.id, policy.defaultConfig[policy.id])
        } else {
          this.removePolicy(policy.id)
        }
      })
      toggle.appendChild(checkbox)
      toggle.appendChild(document.createTextNode(' Enable'))

      policyCard.appendChild(controls)
      policyCard.appendChild(toggle)
      panel.querySelector('.card-body')?.appendChild(policyCard)
    }

    return panel
  }

  /**
   * Render policy order panel with drag-and-drop
   */
  private renderPolicyOrder(): HTMLElement {
    const panel = card('Policy Execution Order')
    const body = panel.querySelector('.card-body')!

    const orderList = createElement('div', { className: 'policy-order-list' })

    for (let i = 0; i < this.state.order.length; i++) {
      const policyId = this.state.order[i]
      const policyMeta = getAllPolicies().find((p) => p.id === policyId)
      if (!policyMeta) continue

      const item = createElement(
        'div',
        { className: 'policy-order-item', draggable: 'true' },
        createElement('span', { className: 'order-number' }, String(i + 1)),
        createElement('span', { className: 'policy-name' }, policyMeta.name),
        createElement(
          'div',
          { className: 'order-buttons' },
          button('↑', () => this.movePolicyUp(i), 'btn-small'),
          button('↓', () => this.movePolicyDown(i), 'btn-small')
        )
      )

      // Drag and drop handlers
      item.addEventListener('dragstart', (e) => {
        ;(e.dataTransfer as DataTransfer).effectAllowed = 'move'
        ;(e.dataTransfer as DataTransfer).setData('text/plain', String(i))
      })

      item.addEventListener('dragover', (e) => {
        e.preventDefault()
        ;(e.dataTransfer as DataTransfer).dropEffect = 'move'
      })

      item.addEventListener('drop', (e) => {
        e.preventDefault()
        const fromIndex = parseInt((e.dataTransfer as DataTransfer).getData('text/plain'))
        this.reorderPolicy(fromIndex, i)
      })

      orderList.appendChild(item)
    }

    body.appendChild(orderList)

    const resetBtn = button(
      'Reset to Default Order',
      () => {
        this.state.order = getDefaultPolicyOrder()
        this.render()
        this.notifyChange()
      },
      'btn-secondary'
    )
    body.appendChild(resetBtn)

    return panel
  }

  /**
   * Render simulation panel
   */
  private renderSimulation(): HTMLElement {
    const panel = card('Policy Simulation')
    const body = panel.querySelector('.card-body')!

    // Mock span input
    body.appendChild(createElement('p', {}, 'Test your policy configuration:'))

    const mockSpanInput = createElement('textarea', {
      className: 'mock-span-input',
      placeholder: 'Enter mock span JSON (optional)'
    }) as HTMLTextAreaElement
    mockSpanInput.value = JSON.stringify(
      {
        type: 'execution',
        kind: 'run_code',
        input: { code: 'return 2 + 2' },
        duration_ms: 50,
        meta: {
          created_at: new Date().toISOString()
        }
      },
      null,
      2
    )
    body.appendChild(mockSpanInput)

    // Simulate button
    const simulateBtn = button(
      'Simulate Policies',
      () => {
        try {
          const mockSpan = JSON.parse(mockSpanInput.value || '{}')
          const result = simulatePolicy(mockSpan, this.state.config, this.state.order)
          this.state.simulationResult = result
          this.renderSimulationResult(body, result)
          toast('Simulation complete', 'success')
        } catch (err) {
          toast('Invalid span JSON: ' + (err as Error).message, 'error')
        }
      },
      'btn-primary'
    )
    body.appendChild(simulateBtn)

    // Simulation result
    if (this.state.simulationResult) {
      this.renderSimulationResult(body, this.state.simulationResult)
    }

    return panel
  }

  /**
   * Render simulation result
   */
  private renderSimulationResult(container: HTMLElement, result: any): void {
    const existing = container.querySelector('.simulation-result')
    if (existing) existing.remove()

    const resultDiv = createElement('div', { className: 'simulation-result' })

    // Decision
    const decisionClass = result.decision === 'allow' ? 'decision-allow' : 'decision-deny'
    resultDiv.appendChild(
      createElement(
        'div',
        { className: `decision ${decisionClass}` },
        `Decision: ${result.decision.toUpperCase()}`
      )
    )

    // Reason
    if (result.reason) {
      resultDiv.appendChild(
        createElement('div', { className: 'reason' }, `Reason: ${result.reason}`)
      )
    }

    // Applied policies
    resultDiv.appendChild(
      createElement(
        'div',
        { className: 'applied-policies' },
        `Applied policies: ${result.policy_applied.join(', ') || 'none'}`
      )
    )

    // Metrics
    if (result.metrics) {
      resultDiv.appendChild(
        createElement(
          'div',
          { className: 'metrics' },
          createElement('strong', {}, 'Metrics:'),
          createElement(
            'ul',
            {},
            createElement('li', {}, `Evaluation time: ${result.metrics.evaluationTime}ms`),
            createElement(
              'li',
              {},
              `Policies evaluated: ${result.metrics.policiesEvaluated}`
            ),
            createElement('li', {}, `Can deny: ${result.metrics.canDeny ? 'Yes' : 'No'}`)
          )
        )
      )
    }

    container.appendChild(resultDiv)
  }

  /**
   * Render profiles panel
   */
  private renderProfiles(): HTMLElement {
    const panel = card('Policy Profiles')
    const body = panel.querySelector('.card-body')!

    // Profile list
    const profileList = createElement('div', { className: 'profile-list' })

    for (const profile of this.state.profiles) {
      const item = createElement(
        'div',
        { className: 'profile-item' },
        createElement('span', { className: 'profile-name' }, profile.name),
        createElement(
          'div',
          { className: 'profile-actions' },
          button('Load', () => this.loadProfile(profile), 'btn-small'),
          button('Delete', () => this.deleteProfile(profile.name), 'btn-small btn-danger')
        )
      )
      profileList.appendChild(item)
    }

    body.appendChild(profileList)

    // Save current profile
    const saveDiv = createElement('div', { className: 'save-profile' })
    const nameInput = createElement('input', {
      type: 'text',
      placeholder: 'Profile name'
    }) as HTMLInputElement
    const saveBtn = button(
      'Save Current',
      () => {
        const name = nameInput.value.trim()
        if (!name) {
          toast('Please enter a profile name', 'error')
          return
        }
        this.saveProfile(name)
        nameInput.value = ''
      },
      'btn-secondary'
    )

    saveDiv.appendChild(nameInput)
    saveDiv.appendChild(saveBtn)
    body.appendChild(saveDiv)

    return panel
  }

  /**
   * Update policy configuration
   */
  private updateConfig(policyId: string, value: any): void {
    this.state.config = {
      ...this.state.config,
      [policyId]: value
    }
    this.notifyChange()
  }

  /**
   * Remove policy from configuration
   */
  private removePolicy(policyId: string): void {
    const newConfig = { ...this.state.config }
    delete newConfig[policyId as keyof PolicyConfig]
    this.state.config = newConfig
    this.render()
    this.notifyChange()
  }

  /**
   * Move policy up in order
   */
  private movePolicyUp(index: number): void {
    if (index === 0) return
    const newOrder = [...this.state.order]
    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
    this.state.order = newOrder
    this.render()
    this.notifyChange()
  }

  /**
   * Move policy down in order
   */
  private movePolicyDown(index: number): void {
    if (index === this.state.order.length - 1) return
    const newOrder = [...this.state.order]
    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
    this.state.order = newOrder
    this.render()
    this.notifyChange()
  }

  /**
   * Reorder policy via drag and drop
   */
  private reorderPolicy(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return
    const newOrder = [...this.state.order]
    const [moved] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, moved)
    this.state.order = newOrder
    this.render()
    this.notifyChange()
  }

  /**
   * Save current configuration as profile
   */
  private saveProfile(name: string): void {
    const profile: PolicyProfile = {
      name,
      config: { ...this.state.config },
      order: [...this.state.order],
      description: `Saved at ${new Date().toLocaleString()}`
    }

    // Replace if exists
    const index = this.state.profiles.findIndex((p) => p.name === name)
    if (index >= 0) {
      this.state.profiles[index] = profile
    } else {
      this.state.profiles.push(profile)
    }

    this.saveProfiles()
    this.render()
    toast(`Profile "${name}" saved`, 'success')
  }

  /**
   * Load profile
   */
  private loadProfile(profile: PolicyProfile): void {
    this.state.config = { ...profile.config }
    this.state.order = [...profile.order]
    this.render()
    this.notifyChange()
    toast(`Profile "${profile.name}" loaded`, 'success')
  }

  /**
   * Delete profile
   */
  private deleteProfile(name: string): void {
    if (!confirm(`Delete profile "${name}"?`)) return
    this.state.profiles = this.state.profiles.filter((p) => p.name !== name)
    this.saveProfiles()
    this.render()
    toast(`Profile "${name}" deleted`, 'success')
  }

  /**
   * Load profiles from localStorage
   */
  private loadProfiles(): PolicyProfile[] {
    try {
      const stored = localStorage.getItem('minicore_policy_profiles')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  /**
   * Save profiles to localStorage
   */
  private saveProfiles(): void {
    try {
      localStorage.setItem(
        'minicore_policy_profiles',
        JSON.stringify(this.state.profiles)
      )
    } catch (err) {
      console.error('Failed to save profiles:', err)
    }
  }

  /**
   * Notify configuration change
   */
  private notifyChange(): void {
    this.onConfigChange?.(this.state.config, this.state.order)
  }

  /**
   * Get current configuration
   */
  getConfig(): { config: PolicyConfig; order: string[] } {
    return {
      config: { ...this.state.config },
      order: [...this.state.order]
    }
  }

  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    return JSON.stringify(
      {
        config: this.state.config,
        order: this.state.order
      },
      null,
      2
    )
  }
}
