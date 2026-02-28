'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { IoCheckmarkCircle } from 'react-icons/io5'
import { FiPackage, FiTruck, FiShoppingCart } from 'react-icons/fi'
import { HiOutlineBell } from 'react-icons/hi'

interface ThresholdSettings {
  minStockLevel: number
  reorderPoint: number
  maxDelayHours: number
  orderAgeWarningDays: number
  defaultSlackChannel: string
  defaultEmailRecipients: string[]
}

interface SettingsSectionProps {
  settings: ThresholdSettings
  onSave: (settings: ThresholdSettings) => void
}

export default function SettingsSection({ settings, onSave }: SettingsSectionProps) {
  const [local, setLocal] = useState<ThresholdSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [emailInput, setEmailInput] = useState('')

  useEffect(() => {
    setLocal(settings)
  }, [settings])

  const handleSave = () => {
    onSave(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const addEmail = () => {
    const trimmed = emailInput.trim()
    if (trimmed && !local.defaultEmailRecipients.includes(trimmed)) {
      setLocal(prev => ({ ...prev, defaultEmailRecipients: [...prev.defaultEmailRecipients, trimmed] }))
      setEmailInput('')
    }
  }

  const removeEmail = (email: string) => {
    setLocal(prev => ({ ...prev, defaultEmailRecipients: prev.defaultEmailRecipients.filter(e => e !== email) }))
  }

  return (
    <div className="flex-1 p-6 space-y-8 overflow-y-auto max-w-3xl">
      <div>
        <h2 className="font-serif font-medium text-2xl tracking-wider" style={{ color: 'hsl(30 5% 15%)' }}>Settings</h2>
        <p className="font-serif font-light text-sm tracking-wider mt-1" style={{ color: 'hsl(30 5% 50%)' }}>Configure alert thresholds and notification channels</p>
      </div>

      <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <FiPackage className="w-5 h-5" style={{ color: 'hsl(40 30% 45%)' }} />
            <CardTitle className="font-serif text-sm tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>INVENTORY THRESHOLDS</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>MINIMUM STOCK LEVEL (UNITS)</Label>
              <Input
                type="number"
                value={local.minStockLevel}
                onChange={(e) => setLocal(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) || 0 }))}
                className="rounded-none mt-2 font-light"
                style={{ borderColor: 'hsl(30 10% 88%)' }}
                min={0}
              />
              <p className="text-xs font-light mt-1" style={{ color: 'hsl(30 5% 60%)' }}>Alerts trigger when any SKU falls below this level</p>
            </div>
            <div>
              <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>REORDER POINT (UNITS)</Label>
              <Input
                type="number"
                value={local.reorderPoint}
                onChange={(e) => setLocal(prev => ({ ...prev, reorderPoint: parseInt(e.target.value) || 0 }))}
                className="rounded-none mt-2 font-light"
                style={{ borderColor: 'hsl(30 10% 88%)' }}
                min={0}
              />
              <p className="text-xs font-light mt-1" style={{ color: 'hsl(30 5% 60%)' }}>Warning issued when stock reaches this level</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <FiTruck className="w-5 h-5" style={{ color: 'hsl(40 30% 45%)' }} />
            <CardTitle className="font-serif text-sm tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>SHIPPING THRESHOLDS</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div>
            <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>MAX ACCEPTABLE DELAY (HOURS)</Label>
            <div className="flex items-center gap-4 mt-3">
              <Slider
                value={[local.maxDelayHours]}
                onValueChange={(val) => setLocal(prev => ({ ...prev, maxDelayHours: val[0] ?? prev.maxDelayHours }))}
                min={1}
                max={168}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={local.maxDelayHours}
                onChange={(e) => setLocal(prev => ({ ...prev, maxDelayHours: parseInt(e.target.value) || 1 }))}
                className="rounded-none w-20 font-light text-center"
                style={{ borderColor: 'hsl(30 10% 88%)' }}
                min={1}
                max={168}
              />
            </div>
            <p className="text-xs font-light mt-1" style={{ color: 'hsl(30 5% 60%)' }}>Shipments delayed beyond this are flagged as critical</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <FiShoppingCart className="w-5 h-5" style={{ color: 'hsl(40 30% 45%)' }} />
            <CardTitle className="font-serif text-sm tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>ORDER THRESHOLDS</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-4">
          <div>
            <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>ORDER AGE WARNING (DAYS)</Label>
            <div className="flex items-center gap-4 mt-3">
              <Slider
                value={[local.orderAgeWarningDays]}
                onValueChange={(val) => setLocal(prev => ({ ...prev, orderAgeWarningDays: val[0] ?? prev.orderAgeWarningDays }))}
                min={1}
                max={30}
                step={1}
                className="flex-1"
              />
              <Input
                type="number"
                value={local.orderAgeWarningDays}
                onChange={(e) => setLocal(prev => ({ ...prev, orderAgeWarningDays: parseInt(e.target.value) || 1 }))}
                className="rounded-none w-20 font-light text-center"
                style={{ borderColor: 'hsl(30 10% 88%)' }}
                min={1}
                max={30}
              />
            </div>
            <p className="text-xs font-light mt-1" style={{ color: 'hsl(30 5% 60%)' }}>Orders older than this threshold are flagged for review</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)' }}>
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <HiOutlineBell className="w-5 h-5" style={{ color: 'hsl(40 30% 45%)' }} />
            <CardTitle className="font-serif text-sm tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>NOTIFICATION CHANNELS</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          <div>
            <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>DEFAULT SLACK CHANNEL</Label>
            <Input
              value={local.defaultSlackChannel}
              onChange={(e) => setLocal(prev => ({ ...prev, defaultSlackChannel: e.target.value }))}
              placeholder="#logistics-alerts"
              className="rounded-none mt-2 font-light"
              style={{ borderColor: 'hsl(30 10% 88%)' }}
            />
          </div>
          <div>
            <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>DEFAULT EMAIL RECIPIENTS</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="email@example.com"
                type="email"
                className="rounded-none font-light"
                style={{ borderColor: 'hsl(30 10% 88%)' }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }}
              />
              <Button variant="outline" onClick={addEmail} className="rounded-none font-serif text-xs tracking-wider" style={{ borderColor: 'hsl(30 10% 88%)', color: 'hsl(30 5% 30%)' }}>
                ADD
              </Button>
            </div>
            {local.defaultEmailRecipients.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {local.defaultEmailRecipients.map((email) => (
                  <span key={email} className="inline-flex items-center gap-1 px-2 py-1 text-xs font-light" style={{ background: 'hsl(30 8% 92%)', color: 'hsl(30 5% 30%)' }}>
                    {email}
                    <button onClick={() => removeEmail(email)} className="ml-1 hover:opacity-70" style={{ color: 'hsl(30 5% 50%)' }}>x</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 pb-8">
        <Button
          onClick={handleSave}
          className="rounded-none font-serif tracking-widest text-xs px-8 py-5 transition-all duration-200"
          style={{ background: 'hsl(40 30% 45%)', color: '#fff' }}
        >
          SAVE SETTINGS
        </Button>
        {saved && (
          <span className="flex items-center gap-2 text-sm font-serif font-light tracking-wider" style={{ color: 'hsl(130 40% 40%)' }}>
            <IoCheckmarkCircle className="w-4 h-4" /> Settings saved
          </span>
        )}
      </div>
    </div>
  )
}
