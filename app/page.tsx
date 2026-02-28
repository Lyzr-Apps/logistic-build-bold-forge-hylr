'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import SidebarNav from './sections/SidebarNav'
import DashboardSection from './sections/DashboardSection'
import AlertReviewSection from './sections/AlertReviewSection'
import AlertHistorySection from './sections/AlertHistorySection'
import SettingsSection from './sections/SettingsSection'
import ProductManagementSection from './sections/ProductManagementSection'
import type { Product } from './sections/ProductManagementSection'

// --- Types ---

interface Alert {
  id: string
  title: string
  category: string
  severity: string
  description: string
  affected_items: string
  recommended_action: string
  timestamp: string
}

interface DispatchResult {
  dispatched_alerts: { alert_id: string; alert_title: string; channels_sent: string[]; status: string; timestamp: string }[]
  total_dispatched: number
  slack_status: string
  email_status: string
  summary: string
}

interface ThresholdSettings {
  minStockLevel: number
  reorderPoint: number
  maxDelayHours: number
  orderAgeWarningDays: number
  defaultSlackChannel: string
  defaultEmailRecipients: string[]
}

interface HistoryEntry {
  id: string
  date: string
  totalAlerts: number
  alertsDispatched: number
  status: string
  alerts: Alert[]
}

type Section = 'dashboard' | 'products' | 'review' | 'history' | 'settings'

// --- Constants ---

const MANAGER_AGENT_ID = '69a27d578e6d0e51fd5cd3b6'
const DISPATCHER_AGENT_ID = '69a27d78a96eb35aa78a9c82'

const DEFAULT_SETTINGS: ThresholdSettings = {
  minStockLevel: 50,
  reorderPoint: 100,
  maxDelayHours: 48,
  orderAgeWarningDays: 7,
  defaultSlackChannel: '#logistics-alerts',
  defaultEmailRecipients: [],
}

const SAMPLE_ALERTS: Alert[] = [
  { id: 'inv-001', title: 'Low Stock: Chanel No. 5 EDP 100ml', category: 'Inventory', severity: 'Critical', description: 'Current stock at 12 units, well below minimum threshold of 50 units. Projected stockout in 3 days based on current sales velocity.', affected_items: 'Chanel No. 5 EDP 100ml (SKU: CHN5-100)', recommended_action: 'Place emergency reorder of 200 units with priority shipping. Contact supplier for expedited fulfillment.', timestamp: '2024-01-15 09:23' },
  { id: 'inv-002', title: 'Approaching Reorder: Tom Ford Oud Wood', category: 'Inventory', severity: 'Warning', description: 'Stock at 95 units, approaching reorder point of 100. Current demand trend suggests reorder within 5 days.', affected_items: 'Tom Ford Oud Wood 50ml (SKU: TF-OW-50)', recommended_action: 'Schedule standard reorder within 48 hours to maintain optimal stock levels.', timestamp: '2024-01-15 09:23' },
  { id: 'ship-001', title: 'Delayed Shipment: Dior Sauvage Batch', category: 'Shipping', severity: 'Critical', description: 'Shipment SH-2024-0891 delayed 72 hours at customs in Rotterdam. Contains 500 units of Dior Sauvage EDT and EDP variants.', affected_items: 'Dior Sauvage EDT 100ml (250 units), Dior Sauvage EDP 60ml (250 units)', recommended_action: 'Contact customs broker immediately. Prepare alternative stock allocation from secondary warehouse.', timestamp: '2024-01-15 08:45' },
  { id: 'ship-002', title: 'Routing Change: Mediterranean Shipment', category: 'Shipping', severity: 'Info', description: 'Shipment SH-2024-0903 rerouted via alternative port due to weather conditions. Estimated 12-hour delay.', affected_items: 'Mixed luxury fragrance order (15 SKUs)', recommended_action: 'Monitor tracking updates. No immediate action required.', timestamp: '2024-01-15 07:30' },
  { id: 'ord-001', title: 'Stale Order: Wholesale Client Pending 14 Days', category: 'Orders', severity: 'Warning', description: 'Order ORD-2024-4521 from premium wholesale client has been in processing for 14 days without fulfillment confirmation.', affected_items: 'Bulk order: 50x Acqua di Parma Colonia, 30x Jo Malone English Pear', recommended_action: 'Escalate to fulfillment team lead. Contact client with status update and revised timeline.', timestamp: '2024-01-15 06:00' },
]

// --- Error Boundary ---

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(0 0% 99%)', color: 'hsl(30 5% 15%)' }}>
          <div className="text-center p-8 max-w-md">
            <h2 className="font-serif text-xl font-medium mb-2 tracking-wider">Something went wrong</h2>
            <p className="text-sm font-light mb-4" style={{ color: 'hsl(30 5% 50%)' }}>{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-6 py-2 text-sm font-serif tracking-widest"
              style={{ background: 'hsl(40 30% 45%)', color: '#fff' }}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Helpers ---

function loadSettings(): ThresholdSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem('perfume-logistics-settings')
    if (stored) return JSON.parse(stored)
  } catch {}
  return DEFAULT_SETTINGS
}

function saveSettings(settings: ThresholdSettings) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('perfume-logistics-settings', JSON.stringify(settings))
  } catch {}
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('perfume-logistics-history')
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

function saveHistory(history: HistoryEntry[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('perfume-logistics-history', JSON.stringify(history))
  } catch {}
}

function loadProducts(): Product[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem('perfume-logistics-products')
    if (stored) return JSON.parse(stored)
  } catch {}
  return []
}

function saveProducts(products: Product[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('perfume-logistics-products', JSON.stringify(products))
  } catch {}
}

function generateId(): string {
  return 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

// --- Page ---

export default function Page() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [totalCritical, setTotalCritical] = useState(0)
  const [totalWarning, setTotalWarning] = useState(0)
  const [totalInfo, setTotalInfo] = useState(0)
  const [overallSummary, setOverallSummary] = useState('')
  const [checkTimestamp, setCheckTimestamp] = useState('')

  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [sampleMode, setSampleMode] = useState(false)

  const [dispatchResult, setDispatchResult] = useState<DispatchResult | null>(null)
  const [dispatching, setDispatching] = useState(false)
  const [dispatchError, setDispatchError] = useState<string | null>(null)

  const [settings, setSettings] = useState<ThresholdSettings>(DEFAULT_SETTINGS)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    setSettings(loadSettings())
    setHistory(loadHistory())
    setProducts(loadProducts())
  }, [])

  const handleUpdateProducts = useCallback((updatedProducts: Product[]) => {
    setProducts(updatedProducts)
    saveProducts(updatedProducts)
  }, [])

  const handleToggleSample = useCallback((val: boolean) => {
    setSampleMode(val)
    if (val) {
      setAlerts(SAMPLE_ALERTS)
      setTotalCritical(2)
      setTotalWarning(2)
      setTotalInfo(1)
      setOverallSummary('Sample mode active. 5 alerts detected across inventory, shipping, and orders. 2 critical issues require immediate attention: low stock on Chanel No. 5 and a customs-delayed Dior Sauvage shipment.')
      setCheckTimestamp('2024-01-15 09:23 UTC')
      setError(null)
    } else {
      setAlerts([])
      setTotalCritical(0)
      setTotalWarning(0)
      setTotalInfo(0)
      setOverallSummary('')
      setCheckTimestamp('')
    }
  }, [])

  const handleRunCheck = useCallback(async () => {
    setLoading(true)
    setError(null)
    setLoadingStep('Initializing logistics analysis...')

    const s = settings
    const activeProducts = products.filter(p => p.status === 'Active' || p.status === 'Out of Stock')
    const productCatalog = activeProducts.length > 0
      ? `\n\nProduct Catalog (${activeProducts.length} products):\n${activeProducts.map(p =>
          `- ${p.name} (SKU: ${p.sku}, ${p.category} ${p.size}, Brand: ${p.brand}) | Current Stock: ${p.currentStock} units | Min Stock: ${p.minStock} | Reorder Point: ${p.reorderPoint} | Price: $${p.price.toFixed(2)} | Supplier: ${p.supplier} | Status: ${p.status}`
        ).join('\n')}`
      : ''

    const message = `Run a comprehensive logistics check for our perfume supply chain operations.

Alert Thresholds:
- Minimum stock level: ${s.minStockLevel} units per SKU
- Reorder point: ${s.reorderPoint} units
- Maximum acceptable shipping delay: ${s.maxDelayHours} hours
- Order age warning threshold: ${s.orderAgeWarningDays} days
${productCatalog}

Please analyze inventory levels against the product catalog above, check active shipments, and review order pipeline. Flag any items that breach these thresholds with appropriate severity levels (Critical/Warning/Info). Use the actual product names and SKUs from the catalog in your alerts.`

    const steps = [
      'Analyzing inventory levels...',
      'Checking shipment statuses...',
      'Reviewing order pipeline...',
      'Aggregating findings...',
    ]
    let stepIdx = 0
    const stepInterval = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1)
      setLoadingStep(steps[stepIdx] ?? '')
    }, 3000)

    try {
      const result = await callAIAgent(message, MANAGER_AGENT_ID)
      clearInterval(stepInterval)

      if (result.success) {
        const data = result?.response?.result
        const invAlerts = Array.isArray(data?.inventory_alerts) ? data.inventory_alerts : []
        const shipAlerts = Array.isArray(data?.shipping_alerts) ? data.shipping_alerts : []
        const ordAlerts = Array.isArray(data?.order_alerts) ? data.order_alerts : []
        const allAlerts = [...invAlerts, ...shipAlerts, ...ordAlerts]

        setAlerts(allAlerts)
        setTotalCritical(data?.total_critical ?? 0)
        setTotalWarning(data?.total_warning ?? 0)
        setTotalInfo(data?.total_info ?? 0)
        setOverallSummary(data?.overall_summary ?? '')
        setCheckTimestamp(data?.check_timestamp ?? new Date().toISOString())

        const entry: HistoryEntry = {
          id: generateId(),
          date: new Date().toLocaleString(),
          totalAlerts: allAlerts.length,
          alertsDispatched: 0,
          status: 'Reviewed',
          alerts: allAlerts,
        }
        setHistory(prev => {
          const updated = [entry, ...prev].slice(0, 50)
          saveHistory(updated)
          return updated
        })
      } else {
        setError(result?.error ?? 'Failed to run logistics check. Please try again.')
      }
    } catch (err) {
      clearInterval(stepInterval)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }, [settings, products])

  const handleDispatch = useCallback(async (selectedAlerts: Alert[], slackChannel: string, emailRecipients: string[]) => {
    setDispatching(true)
    setDispatchError(null)
    setDispatchResult(null)

    const dispatchMessage = `Dispatch the following alerts to Slack channel "${slackChannel}" and email recipients ${emailRecipients.length > 0 ? emailRecipients.join(', ') : 'none specified'}:

${selectedAlerts.map(a => `- [${a.severity}] ${a.title}: ${a.description}. Recommended action: ${a.recommended_action}`).join('\n')}`

    try {
      const result = await callAIAgent(dispatchMessage, DISPATCHER_AGENT_ID)

      if (result.success) {
        const data = result?.response?.result
        const dr: DispatchResult = {
          dispatched_alerts: Array.isArray(data?.dispatched_alerts) ? data.dispatched_alerts : [],
          total_dispatched: data?.total_dispatched ?? 0,
          slack_status: data?.slack_status ?? 'unknown',
          email_status: data?.email_status ?? 'unknown',
          summary: data?.summary ?? 'Alerts dispatched.',
        }
        setDispatchResult(dr)

        setHistory(prev => {
          if (prev.length === 0) return prev
          const updated = [...prev]
          updated[0] = {
            ...updated[0],
            alertsDispatched: (updated[0]?.alertsDispatched ?? 0) + selectedAlerts.length,
            status: 'Dispatched',
          }
          saveHistory(updated)
          return updated
        })
      } else {
        setDispatchError(result?.error ?? 'Failed to dispatch alerts.')
      }
    } catch (err) {
      setDispatchError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setDispatching(false)
    }
  }, [])

  const handleSaveSettings = useCallback((newSettings: ThresholdSettings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
  }, [])

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen font-serif" style={{ background: 'hsl(0 0% 99%)', color: 'hsl(30 5% 15%)' }}>
        <SidebarNav
          activeSection={activeSection}
          onNavigate={setActiveSection}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
          totalCritical={totalCritical}
          totalWarning={totalWarning}
          productCount={products.length}
        />

        {activeSection === 'dashboard' && (
          <DashboardSection
            alerts={alerts}
            totalCritical={totalCritical}
            totalWarning={totalWarning}
            totalInfo={totalInfo}
            overallSummary={overallSummary}
            checkTimestamp={checkTimestamp}
            loading={loading}
            loadingStep={loadingStep}
            error={error}
            sampleMode={sampleMode}
            onToggleSample={handleToggleSample}
            onRunCheck={handleRunCheck}
            products={products}
            onNavigateToProducts={() => setActiveSection('products')}
          />
        )}

        {activeSection === 'products' && (
          <ProductManagementSection
            products={products}
            onUpdateProducts={handleUpdateProducts}
          />
        )}

        {activeSection === 'review' && (
          <AlertReviewSection
            alerts={alerts}
            onDispatch={handleDispatch}
            dispatchResult={dispatchResult}
            dispatching={dispatching}
            dispatchError={dispatchError}
          />
        )}

        {activeSection === 'history' && (
          <AlertHistorySection history={history} />
        )}

        {activeSection === 'settings' && (
          <SettingsSection settings={settings} onSave={handleSaveSettings} />
        )}
      </div>
    </ErrorBoundary>
  )
}
