'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { IoAlertCircle, IoInformationCircle, IoCheckmarkCircle } from 'react-icons/io5'
import { FiSend, FiPackage, FiTruck, FiShoppingCart } from 'react-icons/fi'

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

interface DispatchedAlert {
  alert_id: string
  alert_title: string
  channels_sent: string[]
  status: string
  timestamp: string
}

interface AlertReviewSectionProps {
  alerts: Alert[]
  onDispatch: (selectedAlerts: Alert[], slackChannel: string, emailRecipients: string[]) => Promise<void>
  dispatchResult: {
    dispatched_alerts: DispatchedAlert[]
    total_dispatched: number
    slack_status: string
    email_status: string
    summary: string
  } | null
  dispatching: boolean
  dispatchError: string | null
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
  if (c.includes('inventory')) return <FiPackage className="w-3 h-3" />
  if (c.includes('ship')) return <FiTruck className="w-3 h-3" />
  return <FiShoppingCart className="w-3 h-3" />
}

export default function AlertReviewSection({
  alerts,
  onDispatch,
  dispatchResult,
  dispatching,
  dispatchError,
}: AlertReviewSectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [focusedAlert, setFocusedAlert] = useState<Alert | null>(null)
  const [slackChannel, setSlackChannel] = useState('#logistics-alerts')
  const [emailInput, setEmailInput] = useState('')
  const [emailRecipients, setEmailRecipients] = useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(alerts.map(a => a.id)))
  }

  const selectCritical = () => {
    setSelectedIds(new Set(alerts.filter(a => (a.severity ?? '').toLowerCase() === 'critical').map(a => a.id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const addEmail = () => {
    const trimmed = emailInput.trim()
    if (trimmed && !emailRecipients.includes(trimmed)) {
      setEmailRecipients(prev => [...prev, trimmed])
      setEmailInput('')
    }
  }

  const removeEmail = (email: string) => {
    setEmailRecipients(prev => prev.filter(e => e !== email))
  }

  const handleDispatch = async () => {
    const selected = alerts.filter(a => selectedIds.has(a.id))
    if (selected.length === 0) return
    await onDispatch(selected, slackChannel, emailRecipients)
  }

  const selectedAlerts = alerts.filter(a => selectedIds.has(a.id))

  if (alerts.length === 0) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <Card className="rounded-none border max-w-md w-full" style={{ borderColor: 'hsl(30 10% 88%)' }}>
          <CardContent className="p-10 text-center">
            <IoInformationCircle className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(30 5% 70%)' }} />
            <p className="font-serif text-sm font-light tracking-wider" style={{ color: 'hsl(30 5% 50%)' }}>
              No alerts to review. Run a logistics check from the Dashboard first.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 space-y-4 overflow-y-auto">
      <div>
        <h2 className="font-serif font-medium text-2xl tracking-wider" style={{ color: 'hsl(30 5% 15%)' }}>Alert Review &amp; Dispatch</h2>
        <p className="font-serif font-light text-sm tracking-wider mt-1" style={{ color: 'hsl(30 5% 50%)' }}>Select alerts to dispatch via Slack and email</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ minHeight: '500px' }}>
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={selectAll} className="rounded-none font-serif text-xs tracking-wider font-light" style={{ borderColor: 'hsl(30 10% 88%)', color: 'hsl(30 5% 30%)' }}>
              SELECT ALL
            </Button>
            <Button variant="outline" size="sm" onClick={selectCritical} className="rounded-none font-serif text-xs tracking-wider font-light" style={{ borderColor: 'hsl(0 50% 45%)', color: 'hsl(0 50% 45%)' }}>
              CRITICAL ONLY
            </Button>
            <Button variant="outline" size="sm" onClick={clearSelection} className="rounded-none font-serif text-xs tracking-wider font-light" style={{ borderColor: 'hsl(30 10% 88%)', color: 'hsl(30 5% 50%)' }}>
              CLEAR
            </Button>
            <span className="ml-auto text-xs font-serif font-light tracking-wider self-center" style={{ color: 'hsl(30 5% 50%)' }}>
              {selectedIds.size} of {alerts.length} selected
            </span>
          </div>

          <ScrollArea className="h-[420px]">
            <div className="space-y-1 pr-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 border cursor-pointer transition-all duration-200"
                  style={{
                    borderColor: focusedAlert?.id === alert.id ? 'hsl(40 30% 45%)' : 'hsl(30 10% 88%)',
                    background: selectedIds.has(alert.id) ? 'hsl(40 30% 45% / 0.04)' : 'hsl(0 0% 100%)',
                  }}
                  onClick={() => setFocusedAlert(alert)}
                >
                  <Checkbox
                    checked={selectedIds.has(alert.id)}
                    onCheckedChange={() => toggleSelect(alert.id)}
                    className="mt-1 rounded-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-serif tracking-wider" style={{ background: severityBg(alert.severity), color: severityColor(alert.severity) }}>
                        {(alert.severity ?? '').toUpperCase()}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-light" style={{ color: 'hsl(30 5% 50%)' }}>
                        {categoryIcon(alert.category)} {alert.category}
                      </span>
                      <span className="ml-auto text-xs font-light" style={{ color: 'hsl(30 5% 70%)' }}>{alert.timestamp}</span>
                    </div>
                    <p className="font-serif text-sm font-normal tracking-wide truncate" style={{ color: 'hsl(30 5% 15%)' }}>{alert.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="space-y-4">
          {focusedAlert ? (
            <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-xs font-serif tracking-wider" style={{ background: severityBg(focusedAlert.severity), color: severityColor(focusedAlert.severity) }}>
                    {(focusedAlert.severity ?? '').toUpperCase()}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-light" style={{ color: 'hsl(30 5% 50%)' }}>
                    {categoryIcon(focusedAlert.category)} {focusedAlert.category}
                  </span>
                </div>
                <CardTitle className="font-serif text-lg font-normal tracking-wide" style={{ color: 'hsl(30 5% 15%)' }}>
                  {focusedAlert.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-4">
                <div>
                  <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>DESCRIPTION</p>
                  <p className="text-sm font-light leading-relaxed" style={{ color: 'hsl(30 5% 25%)' }}>{focusedAlert.description}</p>
                </div>
                <div>
                  <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>AFFECTED ITEMS</p>
                  <p className="text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>{focusedAlert.affected_items}</p>
                </div>
                <div>
                  <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>RECOMMENDED ACTION</p>
                  <p className="text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>{focusedAlert.recommended_action}</p>
                </div>
                <div>
                  <p className="text-xs font-serif tracking-widest font-light mb-1" style={{ color: 'hsl(30 5% 50%)' }}>TIMESTAMP</p>
                  <p className="text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>{focusedAlert.timestamp}</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
              <CardContent className="p-10 text-center">
                <p className="font-serif text-sm font-light tracking-wider" style={{ color: 'hsl(30 5% 50%)' }}>
                  Click an alert to view details
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>SLACK CHANNEL</Label>
              <Input
                value={slackChannel}
                onChange={(e) => setSlackChannel(e.target.value)}
                placeholder="#logistics-alerts"
                className="rounded-none mt-1 font-light text-sm"
                style={{ borderColor: 'hsl(30 10% 88%)' }}
              />
            </div>
            <div>
              <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>EMAIL RECIPIENTS</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                  className="rounded-none font-light text-sm"
                  style={{ borderColor: 'hsl(30 10% 88%)' }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
                />
                <Button variant="outline" onClick={addEmail} className="rounded-none font-serif text-xs tracking-wider" style={{ borderColor: 'hsl(30 10% 88%)', color: 'hsl(30 5% 30%)' }}>
                  ADD
                </Button>
              </div>
              {emailRecipients.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {emailRecipients.map((email) => (
                    <span key={email} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-light" style={{ background: 'hsl(30 8% 92%)', color: 'hsl(30 5% 30%)' }}>
                      {email}
                      <button onClick={() => removeEmail(email)} className="ml-1 hover:opacity-70" style={{ color: 'hsl(30 5% 50%)' }}>x</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Button
                onClick={handleDispatch}
                disabled={selectedIds.size === 0 || dispatching}
                className="w-full rounded-none font-serif tracking-widest text-xs py-5 transition-all duration-200"
                style={{ background: selectedIds.size > 0 ? 'hsl(40 30% 45%)' : 'hsl(30 8% 82%)', color: '#fff' }}
              >
                <FiSend className="w-4 h-4 mr-2" />
                {dispatching ? 'DISPATCHING...' : `DISPATCH ${selectedIds.size} ALERT${selectedIds.size !== 1 ? 'S' : ''}`}
              </Button>
            </div>
          </div>

          {dispatchError && (
            <div className="mt-3 p-3 border text-xs font-light" style={{ borderColor: 'hsl(0 50% 45%)', color: 'hsl(0 50% 45%)', background: 'hsl(0 50% 45% / 0.05)' }}>
              {dispatchError}
            </div>
          )}

          {dispatchResult && (
            <div className="mt-3 p-4 border" style={{ borderColor: 'hsl(130 40% 40%)', background: 'hsl(130 40% 40% / 0.05)' }}>
              <div className="flex items-center gap-2 mb-2">
                <IoCheckmarkCircle className="w-5 h-5" style={{ color: 'hsl(130 40% 40%)' }} />
                <span className="font-serif text-sm font-normal tracking-wider" style={{ color: 'hsl(130 40% 40%)' }}>DISPATCH COMPLETE</span>
              </div>
              <p className="text-sm font-light mb-2" style={{ color: 'hsl(30 5% 25%)' }}>{dispatchResult.summary}</p>
              <div className="flex gap-4 text-xs font-light" style={{ color: 'hsl(30 5% 50%)' }}>
                <span>Total dispatched: {dispatchResult.total_dispatched ?? 0}</span>
                <span>Slack: {dispatchResult.slack_status ?? 'N/A'}</span>
                <span>Email: {dispatchResult.email_status ?? 'N/A'}</span>
              </div>
              {Array.isArray(dispatchResult.dispatched_alerts) && dispatchResult.dispatched_alerts.length > 0 && (
                <div className="mt-3 space-y-1">
                  {dispatchResult.dispatched_alerts.map((da) => (
                    <div key={da.alert_id} className="flex items-center gap-2 text-xs font-light" style={{ color: 'hsl(30 5% 30%)' }}>
                      <IoCheckmarkCircle className="w-3 h-3" style={{ color: 'hsl(130 40% 40%)' }} />
                      <span>{da.alert_title}</span>
                      <span style={{ color: 'hsl(30 5% 60%)' }}>via {Array.isArray(da.channels_sent) ? da.channels_sent.join(', ') : 'N/A'}</span>
                      <span className="ml-auto" style={{ color: 'hsl(30 5% 70%)' }}>{da.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
