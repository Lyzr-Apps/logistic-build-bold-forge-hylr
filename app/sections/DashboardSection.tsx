'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { IoAlertCircle, IoCheckmarkCircle, IoInformationCircle } from 'react-icons/io5'
import { FiPackage, FiTruck, FiShoppingCart } from 'react-icons/fi'
import { HiOutlineClock } from 'react-icons/hi'

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

interface Product {
  id: string
  sku: string
  name: string
  brand: string
  category: string
  size: string
  currentStock: number
  minStock: number
  reorderPoint: number
  price: number
  supplier: string
  status: 'Active' | 'Discontinued' | 'Out of Stock'
  lastUpdated: string
}

interface DashboardSectionProps {
  alerts: Alert[]
  totalCritical: number
  totalWarning: number
  totalInfo: number
  overallSummary: string
  checkTimestamp: string
  loading: boolean
  loadingStep: string
  error: string | null
  sampleMode: boolean
  onToggleSample: (val: boolean) => void
  onRunCheck: () => void
  products?: Product[]
  onNavigateToProducts?: () => void
}

function severityColor(severity: string): string {
  const s = (severity ?? '').toLowerCase()
  if (s === 'critical') return 'hsl(0 50% 45%)'
  if (s === 'warning') return 'hsl(40 80% 50%)'
  return 'hsl(210 60% 50%)'
}

function severityBg(severity: string): string {
  const s = (severity ?? '').toLowerCase()
  if (s === 'critical') return 'hsl(0 50% 45% / 0.08)'
  if (s === 'warning') return 'hsl(40 80% 50% / 0.08)'
  return 'hsl(210 60% 50% / 0.08)'
}

function categoryIcon(category: string) {
  const c = (category ?? '').toLowerCase()
  if (c.includes('inventory')) return <FiPackage className="w-4 h-4" />
  if (c.includes('ship')) return <FiTruck className="w-4 h-4" />
  return <FiShoppingCart className="w-4 h-4" />
}

function severityIcon(severity: string) {
  const s = (severity ?? '').toLowerCase()
  if (s === 'critical') return <IoAlertCircle className="w-4 h-4" />
  if (s === 'warning') return <IoAlertCircle className="w-4 h-4" />
  return <IoInformationCircle className="w-4 h-4" />
}

export default function DashboardSection({
  alerts,
  totalCritical,
  totalWarning,
  totalInfo,
  overallSummary,
  checkTimestamp,
  loading,
  loadingStep,
  error,
  sampleMode,
  onToggleSample,
  onRunCheck,
  products = [],
  onNavigateToProducts,
}: DashboardSectionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)

  const sortedAlerts = [...alerts].sort((a, b) => {
    const order: Record<string, number> = { critical: 0, warning: 1, info: 2 }
    return (order[(a.severity ?? '').toLowerCase()] ?? 3) - (order[(b.severity ?? '').toLowerCase()] ?? 3)
  })

  const filteredAlerts = sortedAlerts.filter((a) => {
    if (filterSeverity && (a.severity ?? '').toLowerCase() !== filterSeverity.toLowerCase()) return false
    if (filterCategory && !(a.category ?? '').toLowerCase().includes(filterCategory.toLowerCase())) return false
    return true
  })

  const inventoryCount = alerts.filter(a => (a.category ?? '').toLowerCase().includes('inventory')).length
  const shippingCount = alerts.filter(a => (a.category ?? '').toLowerCase().includes('ship')).length
  const orderCount = alerts.filter(a => (a.category ?? '').toLowerCase().includes('order')).length

  const activeProducts = products.filter(p => p.status === 'Active')
  const lowStockProducts = activeProducts.filter(p => p.currentStock < p.minStock && p.currentStock > 0)
  const outOfStockProducts = products.filter(p => p.currentStock <= 0 || p.status === 'Out of Stock')
  const totalInventoryValue = activeProducts.reduce((sum, p) => sum + (p.price * p.currentStock), 0)

  const metrics = [
    { label: 'SKUs AT RISK', value: inventoryCount > 0 ? inventoryCount : lowStockProducts.length, color: 'hsl(0 50% 45%)', icon: <FiPackage className="w-5 h-5" /> },
    { label: 'SHIPMENT DELAYS', value: shippingCount, color: 'hsl(40 80% 50%)', icon: <FiTruck className="w-5 h-5" /> },
    { label: 'FLAGGED ORDERS', value: orderCount, color: 'hsl(210 60% 50%)', icon: <FiShoppingCart className="w-5 h-5" /> },
    { label: 'LAST CHECK', value: checkTimestamp || '--', color: 'hsl(30 5% 50%)', icon: <HiOutlineClock className="w-5 h-5" />, isText: true },
  ]

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-medium text-2xl tracking-wider" style={{ color: 'hsl(30 5% 15%)' }}>Dashboard</h2>
          <p className="font-serif font-light text-sm tracking-wider mt-1" style={{ color: 'hsl(30 5% 50%)' }}>Real-time logistics monitoring overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="sample-toggle" className="font-serif text-xs tracking-wider font-light" style={{ color: 'hsl(30 5% 50%)' }}>Sample Data</Label>
            <Switch id="sample-toggle" checked={sampleMode} onCheckedChange={onToggleSample} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="rounded-none border shadow-sm" style={{ borderColor: 'hsl(30 10% 88%)', borderLeft: `3px solid ${m.color}`, background: 'hsl(0 0% 100%)' }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span style={{ color: m.color }}>{m.icon}</span>
                <span className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>{m.label}</span>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-16 rounded-none" />
              ) : (
                <p className="font-serif font-light tracking-wider" style={{ color: 'hsl(30 5% 15%)', fontSize: m.isText ? '0.75rem' : '2rem' }}>
                  {m.isText ? String(m.value) : m.value}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Product Inventory Overview */}
      {products.length > 0 && (
        <Card className="rounded-none border shadow-sm" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
          <CardHeader className="p-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-sm tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>PRODUCT INVENTORY OVERVIEW</CardTitle>
              {onNavigateToProducts && (
                <button
                  onClick={onNavigateToProducts}
                  className="text-xs font-serif tracking-wider font-light underline transition-opacity hover:opacity-70"
                  style={{ color: 'hsl(40 30% 45%)' }}
                >
                  MANAGE PRODUCTS
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 border" style={{ borderColor: 'hsl(30 10% 90%)', background: 'hsl(30 8% 97%)' }}>
                <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>TOTAL SKUs</p>
                <p className="font-serif text-xl font-light" style={{ color: 'hsl(40 30% 45%)' }}>{products.length}</p>
              </div>
              <div className="p-3 border" style={{ borderColor: 'hsl(30 10% 90%)', background: 'hsl(30 8% 97%)' }}>
                <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>ACTIVE</p>
                <p className="font-serif text-xl font-light" style={{ color: 'hsl(130 40% 40%)' }}>{activeProducts.length}</p>
              </div>
              <div className="p-3 border" style={{ borderColor: 'hsl(30 10% 90%)', background: 'hsl(30 8% 97%)' }}>
                <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>LOW STOCK</p>
                <p className="font-serif text-xl font-light" style={{ color: lowStockProducts.length > 0 ? 'hsl(40 80% 50%)' : 'hsl(130 40% 40%)' }}>{lowStockProducts.length}</p>
              </div>
              <div className="p-3 border" style={{ borderColor: 'hsl(30 10% 90%)', background: 'hsl(30 8% 97%)' }}>
                <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>INVENTORY VALUE</p>
                <p className="font-serif text-lg font-light" style={{ color: 'hsl(30 5% 15%)' }}>${totalInventoryValue.toLocaleString()}</p>
              </div>
            </div>

            {/* Low stock quick view */}
            {(lowStockProducts.length > 0 || outOfStockProducts.length > 0) && (
              <div className="space-y-1.5">
                <p className="text-xs font-serif tracking-widest font-light mb-2" style={{ color: 'hsl(30 5% 50%)' }}>ITEMS REQUIRING ATTENTION</p>
                {outOfStockProducts.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 border" style={{ borderColor: 'hsl(0 50% 45% / 0.2)', background: 'hsl(0 50% 45% / 0.03)' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'hsl(0 50% 45%)' }} />
                    <span className="text-xs font-mono font-light" style={{ color: 'hsl(30 5% 50%)' }}>{p.sku}</span>
                    <span className="text-sm font-serif font-light truncate" style={{ color: 'hsl(30 5% 15%)' }}>{p.name}</span>
                    <span className="ml-auto text-xs font-serif font-light flex-shrink-0" style={{ color: 'hsl(0 50% 45%)' }}>OUT OF STOCK</span>
                  </div>
                ))}
                {lowStockProducts.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 border" style={{ borderColor: 'hsl(40 80% 50% / 0.2)', background: 'hsl(40 80% 50% / 0.03)' }}>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'hsl(40 80% 50%)' }} />
                    <span className="text-xs font-mono font-light" style={{ color: 'hsl(30 5% 50%)' }}>{p.sku}</span>
                    <span className="text-sm font-serif font-light truncate" style={{ color: 'hsl(30 5% 15%)' }}>{p.name}</span>
                    <span className="ml-auto text-xs font-serif font-light flex-shrink-0" style={{ color: 'hsl(40 80% 50%)' }}>{p.currentStock} / {p.minStock} units</span>
                  </div>
                ))}
                {(lowStockProducts.length + outOfStockProducts.length) > 6 && onNavigateToProducts && (
                  <button
                    onClick={onNavigateToProducts}
                    className="text-xs font-serif tracking-wider font-light pt-1"
                    style={{ color: 'hsl(40 30% 45%)' }}
                  >
                    View all {lowStockProducts.length + outOfStockProducts.length} items in Products
                  </button>
                )}
              </div>
            )}

            {products.length > 0 && lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
              <div className="flex items-center gap-2 p-3" style={{ background: 'hsl(130 40% 40% / 0.05)' }}>
                <IoCheckmarkCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(130 40% 40%)' }} />
                <span className="text-sm font-serif font-light tracking-wider" style={{ color: 'hsl(130 40% 40%)' }}>All products are within healthy stock levels</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          {overallSummary && !loading && (
            <Card className="rounded-none border shadow-sm" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
              <CardContent className="p-5">
                <p className="font-serif text-sm font-light leading-relaxed tracking-wide" style={{ color: 'hsl(30 5% 15%)' }}>{overallSummary}</p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap gap-2">
            {['Critical', 'Warning', 'Info'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeverity(filterSeverity === s ? null : s)}
                className="px-3 py-1 text-xs font-serif tracking-wider font-light border transition-all duration-200"
                style={{
                  borderColor: filterSeverity === s ? severityColor(s) : 'hsl(30 10% 88%)',
                  color: filterSeverity === s ? severityColor(s) : 'hsl(30 5% 50%)',
                  background: filterSeverity === s ? severityBg(s) : 'transparent',
                }}
              >
                {s.toUpperCase()}
              </button>
            ))}
            <span className="w-px mx-1" style={{ background: 'hsl(30 10% 88%)' }} />
            {['Inventory', 'Shipping', 'Orders'].map((c) => (
              <button
                key={c}
                onClick={() => setFilterCategory(filterCategory === c ? null : c)}
                className="px-3 py-1 text-xs font-serif tracking-wider font-light border transition-all duration-200"
                style={{
                  borderColor: filterCategory === c ? 'hsl(40 30% 45%)' : 'hsl(30 10% 88%)',
                  color: filterCategory === c ? 'hsl(40 30% 45%)' : 'hsl(30 5% 50%)',
                  background: filterCategory === c ? 'hsl(40 30% 45% / 0.08)' : 'transparent',
                }}
              >
                {c.toUpperCase()}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)' }}>
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4 rounded-none" />
                    <Skeleton className="h-3 w-1/2 rounded-none" />
                    <Skeleton className="h-3 w-full rounded-none" />
                  </CardContent>
                </Card>
              ))}
              <p className="text-xs font-serif tracking-wider font-light text-center py-2" style={{ color: 'hsl(40 30% 45%)' }}>{loadingStep}</p>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
              <CardContent className="p-10 text-center">
                <IoCheckmarkCircle className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(30 5% 70%)' }} />
                <p className="font-serif font-light text-sm tracking-wider" style={{ color: 'hsl(30 5% 50%)' }}>
                  {alerts.length === 0 ? 'Configure your thresholds in Settings, then run your first logistics check.' : 'No alerts match the current filters.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2 pr-4">
                {filteredAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className="rounded-none border cursor-pointer transition-all duration-200 hover:shadow-md"
                    style={{ borderColor: 'hsl(30 10% 88%)', borderLeft: `3px solid ${severityColor(alert.severity)}`, background: 'hsl(0 0% 100%)' }}
                    onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <span style={{ color: severityColor(alert.severity) }}>{severityIcon(alert.severity)}</span>
                        <span className="px-2 py-0.5 text-xs font-serif tracking-wider" style={{ background: severityBg(alert.severity), color: severityColor(alert.severity) }}>
                          {(alert.severity ?? '').toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-serif tracking-wider font-light" style={{ color: 'hsl(30 5% 50%)' }}>
                          {categoryIcon(alert.category)}
                          {alert.category}
                        </span>
                        <span className="ml-auto text-xs font-light" style={{ color: 'hsl(30 5% 70%)' }}>{alert.timestamp}</span>
                      </div>
                      <p className="font-serif text-sm font-normal tracking-wide mt-2" style={{ color: 'hsl(30 5% 15%)' }}>{alert.title}</p>
                      {expandedId === alert.id && (
                        <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid hsl(30 10% 90%)' }}>
                          <div>
                            <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>DESCRIPTION</p>
                            <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(30 5% 25%)' }}>{alert.description}</p>
                          </div>
                          <div>
                            <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>AFFECTED ITEMS</p>
                            <p className="text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>{alert.affected_items}</p>
                          </div>
                          <div>
                            <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>RECOMMENDED ACTION</p>
                            <p className="text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>{alert.recommended_action}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="space-y-4">
          <Card className="rounded-none border shadow-sm" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="font-serif text-sm tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>ACTIONS</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <Button
                onClick={onRunCheck}
                disabled={loading}
                className="w-full rounded-none font-serif tracking-widest text-xs py-6 transition-all duration-200"
                style={{ background: 'hsl(40 30% 45%)', color: '#fff' }}
              >
                {loading ? 'ANALYZING...' : 'RUN LOGISTICS CHECK'}
              </Button>
              {error && (
                <div className="mt-3 p-3 border text-xs font-light" style={{ borderColor: 'hsl(0 50% 45%)', color: 'hsl(0 50% 45%)', background: 'hsl(0 50% 45% / 0.05)' }}>
                  {error}
                  <button onClick={onRunCheck} className="block mt-2 underline" style={{ color: 'hsl(40 30% 45%)' }}>Retry</button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-none border shadow-sm" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="font-serif text-sm tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>SEVERITY BREAKDOWN</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-serif tracking-wider font-light" style={{ color: 'hsl(0 50% 45%)' }}>
                  <IoAlertCircle className="w-4 h-4" /> CRITICAL
                </span>
                <span className="font-serif text-lg font-light" style={{ color: 'hsl(0 50% 45%)' }}>{totalCritical}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-serif tracking-wider font-light" style={{ color: 'hsl(40 80% 50%)' }}>
                  <IoAlertCircle className="w-4 h-4" /> WARNING
                </span>
                <span className="font-serif text-lg font-light" style={{ color: 'hsl(40 80% 50%)' }}>{totalWarning}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-serif tracking-wider font-light" style={{ color: 'hsl(210 60% 50%)' }}>
                  <IoInformationCircle className="w-4 h-4" /> INFO
                </span>
                <span className="font-serif text-lg font-light" style={{ color: 'hsl(210 60% 50%)' }}>{totalInfo}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-none border shadow-sm" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
            <CardHeader className="p-5 pb-3">
              <CardTitle className="font-serif text-sm tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>AGENTS</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2" style={{ background: loading ? 'hsl(40 30% 45%)' : 'hsl(30 5% 70%)' }} />
                <span className="text-xs font-serif tracking-wider font-light" style={{ color: 'hsl(30 5% 30%)' }}>Logistics Monitor Manager</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2" style={{ background: 'hsl(30 5% 70%)' }} />
                <span className="text-xs font-serif tracking-wider font-light" style={{ color: 'hsl(30 5% 30%)' }}>Notification Dispatcher</span>
              </div>
              <p className="text-xs font-light mt-2" style={{ color: 'hsl(30 5% 60%)' }}>
                Sub-agents: Inventory, Shipment, Order (managed by Manager)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
