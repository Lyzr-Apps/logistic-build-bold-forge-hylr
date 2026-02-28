'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { IoAlertCircle, IoInformationCircle, IoCheckmarkCircle } from 'react-icons/io5'
import { BiHistory } from 'react-icons/bi'
import { FiPackage, FiTruck, FiShoppingCart } from 'react-icons/fi'

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

interface HistoryEntry {
  id: string
  date: string
  totalAlerts: number
  alertsDispatched: number
  status: string
  alerts: Alert[]
}

interface AlertHistorySectionProps {
  history: HistoryEntry[]
}

function severityColor(severity: string): string {
  const s = (severity ?? '').toLowerCase()
  if (s === 'critical') return 'hsl(0 50% 45%)'
  if (s === 'warning') return 'hsl(40 80% 50%)'
  return 'hsl(210 60% 50%)'
}

function statusColor(status: string): string {
  const s = (status ?? '').toLowerCase()
  if (s === 'dispatched') return 'hsl(130 40% 40%)'
  if (s === 'reviewed') return 'hsl(210 60% 50%)'
  return 'hsl(30 5% 50%)'
}

export default function AlertHistorySection({ history }: AlertHistorySectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sortField, setSortField] = useState<'date' | 'totalAlerts' | 'alertsDispatched' | 'status'>('date')
  const [sortAsc, setSortAsc] = useState(false)

  const filtered = useMemo(() => {
    let items = [...history]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      items = items.filter(h =>
        h.id.toLowerCase().includes(term) ||
        h.date.toLowerCase().includes(term) ||
        h.status.toLowerCase().includes(term) ||
        (Array.isArray(h.alerts) && h.alerts.some(a => (a.title ?? '').toLowerCase().includes(term)))
      )
    }
    items.sort((a, b) => {
      let cmp = 0
      if (sortField === 'date') cmp = (a.date ?? '').localeCompare(b.date ?? '')
      else if (sortField === 'totalAlerts') cmp = (a.totalAlerts ?? 0) - (b.totalAlerts ?? 0)
      else if (sortField === 'alertsDispatched') cmp = (a.alertsDispatched ?? 0) - (b.alertsDispatched ?? 0)
      else if (sortField === 'status') cmp = (a.status ?? '').localeCompare(b.status ?? '')
      return sortAsc ? cmp : -cmp
    })
    return items
  }, [history, searchTerm, sortField, sortAsc])

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc)
    else { setSortField(field); setSortAsc(false) }
  }

  const sortArrow = (field: typeof sortField) => {
    if (sortField !== field) return ''
    return sortAsc ? ' \u2191' : ' \u2193'
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      <div>
        <h2 className="font-serif font-medium text-2xl tracking-wider" style={{ color: 'hsl(30 5% 15%)' }}>Alert History</h2>
        <p className="font-serif font-light text-sm tracking-wider mt-1" style={{ color: 'hsl(30 5% 50%)' }}>Historical log of monitoring runs</p>
      </div>

      <div className="flex gap-4">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by ID, date, status, or alert title..."
          className="rounded-none font-light text-sm max-w-md"
          style={{ borderColor: 'hsl(30 10% 88%)' }}
        />
      </div>

      {history.length === 0 ? (
        <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)' }}>
          <CardContent className="p-10 text-center">
            <BiHistory className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(30 5% 70%)' }} />
            <p className="font-serif text-sm font-light tracking-wider" style={{ color: 'hsl(30 5% 50%)' }}>
              No history yet. Run a logistics check from the Dashboard to create the first entry.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(30 10% 88%)' }}>
                    {[
                      { field: 'date' as const, label: 'DATE' },
                      { field: 'date' as const, label: 'RUN ID' },
                      { field: 'totalAlerts' as const, label: 'TOTAL ALERTS' },
                      { field: 'alertsDispatched' as const, label: 'DISPATCHED' },
                      { field: 'status' as const, label: 'STATUS' },
                    ].map((col, i) => (
                      <th
                        key={i}
                        className="text-left px-5 py-4 text-xs font-serif tracking-widest font-light cursor-pointer select-none transition-colors duration-200"
                        style={{ color: 'hsl(30 5% 50%)' }}
                        onClick={() => handleSort(col.field)}
                      >
                        {col.label}{sortArrow(col.field)}
                      </th>
                    ))}
                    <th className="px-5 py-4" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
                    <React.Fragment key={entry.id}>
                      <tr
                        className="cursor-pointer transition-colors duration-200"
                        style={{ borderBottom: '1px solid hsl(30 10% 92%)' }}
                        onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                      >
                        <td className="px-5 py-4 text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>{entry.date}</td>
                        <td className="px-5 py-4 text-xs font-light font-mono" style={{ color: 'hsl(30 5% 50%)' }}>{entry.id.slice(0, 12)}...</td>
                        <td className="px-5 py-4">
                          <span className="font-serif text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>{entry.totalAlerts}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-serif text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>{entry.alertsDispatched}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="px-2 py-1 text-xs font-serif tracking-wider" style={{ background: `${statusColor(entry.status)}20`, color: statusColor(entry.status) }}>
                            {(entry.status ?? '').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs font-light" style={{ color: 'hsl(30 5% 60%)' }}>
                          {expandedId === entry.id ? 'Collapse' : 'Expand'}
                        </td>
                      </tr>
                      {expandedId === entry.id && Array.isArray(entry.alerts) && (
                        <tr>
                          <td colSpan={6} className="px-5 py-4" style={{ background: 'hsl(30 8% 97%)' }}>
                            <div className="space-y-2">
                              {entry.alerts.map((alert) => (
                                <div key={alert.id} className="flex items-center gap-3 p-3 border" style={{ borderColor: 'hsl(30 10% 90%)', background: 'hsl(0 0% 100%)' }}>
                                  <span className="px-2 py-0.5 text-xs font-serif tracking-wider" style={{ background: `${severityColor(alert.severity)}14`, color: severityColor(alert.severity) }}>
                                    {(alert.severity ?? '').toUpperCase()}
                                  </span>
                                  <span className="text-sm font-light" style={{ color: 'hsl(30 5% 15%)' }}>{alert.title}</span>
                                  <span className="ml-auto text-xs font-light" style={{ color: 'hsl(30 5% 60%)' }}>{alert.category}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
