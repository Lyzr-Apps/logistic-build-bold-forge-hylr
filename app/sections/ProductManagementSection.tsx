'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { FiPackage, FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiCheck } from 'react-icons/fi'
import { IoAlertCircle, IoCheckmarkCircle } from 'react-icons/io5'
import { HiOutlineFilter } from 'react-icons/hi'

export interface Product {
  id: string
  sku: string
  name: string
  brand: string
  category: string // 'EDP' | 'EDT' | 'Parfum' | 'Cologne' | 'Body Mist'
  size: string // e.g. '50ml', '100ml'
  currentStock: number
  minStock: number
  reorderPoint: number
  price: number
  supplier: string
  status: 'Active' | 'Discontinued' | 'Out of Stock'
  lastUpdated: string
}

interface ProductManagementSectionProps {
  products: Product[]
  onUpdateProducts: (products: Product[]) => void
}

const EMPTY_PRODUCT: Omit<Product, 'id' | 'lastUpdated'> = {
  sku: '',
  name: '',
  brand: '',
  category: 'EDP',
  size: '100ml',
  currentStock: 0,
  minStock: 50,
  reorderPoint: 100,
  price: 0,
  supplier: '',
  status: 'Active',
}

const CATEGORIES = ['EDP', 'EDT', 'Parfum', 'Cologne', 'Body Mist']
const SIZES = ['10ml', '30ml', '50ml', '75ml', '100ml', '150ml', '200ml']
const STATUSES: Product['status'][] = ['Active', 'Discontinued', 'Out of Stock']

function generateProductId(): string {
  return 'prod-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)
}

function statusColor(status: string): string {
  if (status === 'Active') return 'hsl(130 40% 40%)'
  if (status === 'Discontinued') return 'hsl(30 5% 50%)'
  return 'hsl(0 50% 45%)'
}

function stockSeverity(product: Product): 'critical' | 'warning' | 'healthy' {
  if (product.currentStock <= 0 || product.currentStock < product.minStock * 0.2) return 'critical'
  if (product.currentStock < product.minStock) return 'warning'
  return 'healthy'
}

function stockSeverityColor(sev: string): string {
  if (sev === 'critical') return 'hsl(0 50% 45%)'
  if (sev === 'warning') return 'hsl(40 80% 50%)'
  return 'hsl(130 40% 40%)'
}

export default function ProductManagementSection({ products, onUpdateProducts }: ProductManagementSectionProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Omit<Product, 'id' | 'lastUpdated'>>(EMPTY_PRODUCT)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    let items = [...products]
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      items = items.filter(p =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.supplier.toLowerCase().includes(term)
      )
    }
    if (filterCategory) {
      items = items.filter(p => p.category === filterCategory)
    }
    if (filterStatus) {
      items = items.filter(p => p.status === filterStatus)
    }
    return items
  }, [products, searchTerm, filterCategory, filterStatus])

  const stats = useMemo(() => {
    const total = products.length
    const active = products.filter(p => p.status === 'Active').length
    const lowStock = products.filter(p => p.currentStock < p.minStock && p.status === 'Active').length
    const outOfStock = products.filter(p => p.currentStock <= 0 || p.status === 'Out of Stock').length
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.currentStock), 0)
    return { total, active, lowStock, outOfStock, totalValue }
  }, [products])

  const openAddForm = () => {
    setEditingId(null)
    setFormData({ ...EMPTY_PRODUCT })
    setFormError(null)
    setShowForm(true)
  }

  const openEditForm = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      sku: product.sku,
      name: product.name,
      brand: product.brand,
      category: product.category,
      size: product.size,
      currentStock: product.currentStock,
      minStock: product.minStock,
      reorderPoint: product.reorderPoint,
      price: product.price,
      supplier: product.supplier,
      status: product.status,
    })
    setFormError(null)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingId(null)
    setFormError(null)
  }

  const handleSave = () => {
    if (!formData.sku.trim()) { setFormError('SKU is required'); return }
    if (!formData.name.trim()) { setFormError('Product name is required'); return }
    if (!formData.brand.trim()) { setFormError('Brand is required'); return }

    const isDuplicate = products.some(p => p.sku === formData.sku.trim() && p.id !== editingId)
    if (isDuplicate) { setFormError('A product with this SKU already exists'); return }

    const now = new Date().toLocaleString()

    if (editingId) {
      const updated = products.map(p =>
        p.id === editingId
          ? { ...p, ...formData, sku: formData.sku.trim(), name: formData.name.trim(), brand: formData.brand.trim(), supplier: formData.supplier.trim(), lastUpdated: now }
          : p
      )
      onUpdateProducts(updated)
      setSuccessMessage(`Product "${formData.name.trim()}" updated successfully`)
    } else {
      const newProduct: Product = {
        ...formData,
        id: generateProductId(),
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        supplier: formData.supplier.trim(),
        lastUpdated: now,
      }
      onUpdateProducts([newProduct, ...products])
      setSuccessMessage(`Product "${formData.name.trim()}" added successfully`)
    }

    closeForm()
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const handleDelete = (id: string) => {
    const product = products.find(p => p.id === id)
    onUpdateProducts(products.filter(p => p.id !== id))
    setDeleteConfirmId(null)
    setSuccessMessage(`Product "${product?.name ?? ''}" removed`)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const updateField = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setFormError(null)
  }

  return (
    <div className="flex-1 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif font-medium text-2xl tracking-wider" style={{ color: 'hsl(30 5% 15%)' }}>Product Catalog</h2>
          <p className="font-serif font-light text-sm tracking-wider mt-1" style={{ color: 'hsl(30 5% 50%)' }}>Manage your perfume inventory and product listings</p>
        </div>
        <Button
          onClick={openAddForm}
          className="rounded-none font-serif tracking-widest text-xs py-5 px-6 transition-all duration-200"
          style={{ background: 'hsl(40 30% 45%)', color: '#fff' }}
        >
          <FiPlus className="w-4 h-4 mr-2" />
          ADD PRODUCT
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 border" style={{ borderColor: 'hsl(130 40% 40%)', background: 'hsl(130 40% 40% / 0.05)' }}>
          <IoCheckmarkCircle className="w-4 h-4 flex-shrink-0" style={{ color: 'hsl(130 40% 40%)' }} />
          <span className="text-sm font-serif font-light tracking-wider" style={{ color: 'hsl(130 40% 40%)' }}>{successMessage}</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'TOTAL PRODUCTS', value: stats.total, color: 'hsl(40 30% 45%)' },
          { label: 'ACTIVE', value: stats.active, color: 'hsl(130 40% 40%)' },
          { label: 'LOW STOCK', value: stats.lowStock, color: 'hsl(40 80% 50%)' },
          { label: 'OUT OF STOCK', value: stats.outOfStock, color: 'hsl(0 50% 45%)' },
          { label: 'INVENTORY VALUE', value: `$${stats.totalValue.toLocaleString()}`, color: 'hsl(40 30% 45%)', isText: true },
        ].map((s, i) => (
          <Card key={i} className="rounded-none border shadow-sm" style={{ borderColor: 'hsl(30 10% 88%)', borderLeft: `3px solid ${s.color}`, background: 'hsl(0 0% 100%)' }}>
            <CardContent className="p-4">
              <p className="font-serif text-xs tracking-widest font-light mb-2" style={{ color: 'hsl(30 5% 50%)' }}>{s.label}</p>
              <p className="font-serif font-light tracking-wider" style={{ color: 'hsl(30 5% 15%)', fontSize: s.isText ? '1rem' : '1.5rem' }}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <Card className="rounded-none border-2" style={{ borderColor: 'hsl(40 30% 45%)', background: 'hsl(0 0% 100%)' }}>
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-serif text-base tracking-widest font-light" style={{ color: 'hsl(30 5% 15%)' }}>
                {editingId ? 'EDIT PRODUCT' : 'ADD NEW PRODUCT'}
              </CardTitle>
              <button onClick={closeForm} className="p-1 hover:opacity-70 transition-opacity" style={{ color: 'hsl(30 5% 50%)' }}>
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-5">
            {formError && (
              <div className="flex items-center gap-2 p-3 border text-xs font-light" style={{ borderColor: 'hsl(0 50% 45%)', color: 'hsl(0 50% 45%)', background: 'hsl(0 50% 45% / 0.05)' }}>
                <IoAlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>SKU *</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => updateField('sku', e.target.value)}
                  placeholder="e.g. CHN5-EDP-100"
                  className="rounded-none mt-1 font-light text-sm"
                  style={{ borderColor: 'hsl(30 10% 88%)' }}
                />
              </div>
              <div className="md:col-span-2">
                <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>PRODUCT NAME *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Chanel No. 5 Eau de Parfum"
                  className="rounded-none mt-1 font-light text-sm"
                  style={{ borderColor: 'hsl(30 10% 88%)' }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>BRAND *</Label>
                <Input
                  value={formData.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                  placeholder="e.g. Chanel"
                  className="rounded-none mt-1 font-light text-sm"
                  style={{ borderColor: 'hsl(30 10% 88%)' }}
                />
              </div>
              <div>
                <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>CONCENTRATION</Label>
                <select
                  value={formData.category}
                  onChange={(e) => updateField('category', e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm font-light border"
                  style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)', color: 'hsl(30 5% 15%)' }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>SIZE</Label>
                <select
                  value={formData.size}
                  onChange={(e) => updateField('size', e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm font-light border"
                  style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)', color: 'hsl(30 5% 15%)' }}
                >
                  {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>STATUS</Label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-sm font-light border"
                  style={{ borderColor: 'hsl(30 10% 88%)', background: 'hsl(0 0% 100%)', color: 'hsl(30 5% 15%)' }}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <div>
                <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>CURRENT STOCK</Label>
                <Input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => updateField('currentStock', parseInt(e.target.value) || 0)}
                  className="rounded-none mt-1 font-light text-sm"
                  style={{ borderColor: 'hsl(30 10% 88%)' }}
                  min={0}
                />
              </div>
              <div>
                <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>MIN STOCK LEVEL</Label>
                <Input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => updateField('minStock', parseInt(e.target.value) || 0)}
                  className="rounded-none mt-1 font-light text-sm"
                  style={{ borderColor: 'hsl(30 10% 88%)' }}
                  min={0}
                />
              </div>
              <div>
                <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>REORDER POINT</Label>
                <Input
                  type="number"
                  value={formData.reorderPoint}
                  onChange={(e) => updateField('reorderPoint', parseInt(e.target.value) || 0)}
                  className="rounded-none mt-1 font-light text-sm"
                  style={{ borderColor: 'hsl(30 10% 88%)' }}
                  min={0}
                />
              </div>
              <div>
                <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>PRICE ($)</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                  className="rounded-none mt-1 font-light text-sm"
                  style={{ borderColor: 'hsl(30 10% 88%)' }}
                  min={0}
                  step={0.01}
                />
              </div>
            </div>

            <div>
              <Label className="font-serif text-xs tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>SUPPLIER</Label>
              <Input
                value={formData.supplier}
                onChange={(e) => updateField('supplier', e.target.value)}
                placeholder="e.g. Chanel Distribution France"
                className="rounded-none mt-1 font-light text-sm"
                style={{ borderColor: 'hsl(30 10% 88%)' }}
              />
            </div>

            <Separator style={{ background: 'hsl(30 10% 90%)' }} />

            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                className="rounded-none font-serif tracking-widest text-xs px-8 py-5 transition-all duration-200"
                style={{ background: 'hsl(40 30% 45%)', color: '#fff' }}
              >
                <FiCheck className="w-4 h-4 mr-2" />
                {editingId ? 'UPDATE PRODUCT' : 'ADD PRODUCT'}
              </Button>
              <Button
                variant="outline"
                onClick={closeForm}
                className="rounded-none font-serif tracking-widest text-xs px-6 py-5"
                style={{ borderColor: 'hsl(30 10% 88%)', color: 'hsl(30 5% 50%)' }}
              >
                CANCEL
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(30 5% 60%)' }} />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, SKU, brand, or supplier..."
            className="rounded-none font-light text-sm pl-10"
            style={{ borderColor: 'hsl(30 10% 88%)' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
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
              {c}
            </button>
          ))}
          <span className="w-px mx-1 self-stretch" style={{ background: 'hsl(30 10% 88%)' }} />
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? null : s)}
              className="px-3 py-1 text-xs font-serif tracking-wider font-light border transition-all duration-200"
              style={{
                borderColor: filterStatus === s ? statusColor(s) : 'hsl(30 10% 88%)',
                color: filterStatus === s ? statusColor(s) : 'hsl(30 5% 50%)',
                background: filterStatus === s ? `${statusColor(s)}14` : 'transparent',
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      {filteredProducts.length === 0 ? (
        <Card className="rounded-none border" style={{ borderColor: 'hsl(30 10% 88%)' }}>
          <CardContent className="p-10 text-center">
            <FiPackage className="w-8 h-8 mx-auto mb-3" style={{ color: 'hsl(30 5% 70%)' }} />
            <p className="font-serif font-light text-sm tracking-wider" style={{ color: 'hsl(30 5% 50%)' }}>
              {products.length === 0 ? 'No products added yet. Click "Add Product" to start building your catalog.' : 'No products match your filters.'}
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
                    {['SKU', 'PRODUCT', 'BRAND', 'TYPE', 'SIZE', 'STOCK', 'MIN', 'PRICE', 'STATUS', 'ACTIONS'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-serif tracking-widest font-light" style={{ color: 'hsl(30 5% 50%)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => {
                    const sev = stockSeverity(product)
                    return (
                      <tr
                        key={product.id}
                        className="transition-colors duration-200"
                        style={{ borderBottom: '1px solid hsl(30 10% 92%)' }}
                      >
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono font-light" style={{ color: 'hsl(30 5% 40%)' }}>{product.sku}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-serif font-normal tracking-wide" style={{ color: 'hsl(30 5% 15%)' }}>{product.name}</span>
                          <br />
                          <span className="text-xs font-light" style={{ color: 'hsl(30 5% 60%)' }}>Updated: {product.lastUpdated}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>{product.brand}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-xs font-serif tracking-wider" style={{ background: 'hsl(40 30% 45% / 0.08)', color: 'hsl(40 30% 45%)' }}>
                            {product.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>{product.size}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: stockSeverityColor(sev) }} />
                            <span className="text-sm font-serif font-light" style={{ color: stockSeverityColor(sev) }}>{product.currentStock}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-light" style={{ color: 'hsl(30 5% 50%)' }}>{product.minStock}</td>
                        <td className="px-4 py-3 text-sm font-light" style={{ color: 'hsl(30 5% 25%)' }}>${product.price.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-xs font-serif tracking-wider" style={{ background: `${statusColor(product.status)}14`, color: statusColor(product.status) }}>
                            {product.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditForm(product)}
                              className="p-1.5 border transition-all duration-200 hover:shadow-sm"
                              style={{ borderColor: 'hsl(30 10% 88%)', color: 'hsl(40 30% 45%)' }}
                              title="Edit product"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>
                            {deleteConfirmId === product.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="p-1.5 border transition-all duration-200"
                                  style={{ borderColor: 'hsl(0 50% 45%)', color: 'hsl(0 50% 45%)', background: 'hsl(0 50% 45% / 0.05)' }}
                                  title="Confirm delete"
                                >
                                  <FiCheck className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="p-1.5 border transition-all duration-200"
                                  style={{ borderColor: 'hsl(30 10% 88%)', color: 'hsl(30 5% 50%)' }}
                                  title="Cancel"
                                >
                                  <FiX className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(product.id)}
                                className="p-1.5 border transition-all duration-200 hover:shadow-sm"
                                style={{ borderColor: 'hsl(30 10% 88%)', color: 'hsl(30 5% 60%)' }}
                                title="Delete product"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Count */}
      <p className="text-xs font-serif font-light tracking-wider text-center" style={{ color: 'hsl(30 5% 60%)' }}>
        Showing {filteredProducts.length} of {products.length} products
      </p>
    </div>
  )
}
