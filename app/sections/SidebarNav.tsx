'use client'

import React from 'react'
import { MdDashboard } from 'react-icons/md'
import { HiOutlineBell, HiOutlineCog } from 'react-icons/hi'
import { BiHistory } from 'react-icons/bi'
import { FiPackage } from 'react-icons/fi'

type Section = 'dashboard' | 'products' | 'review' | 'history' | 'settings'

interface SidebarNavProps {
  activeSection: Section
  onNavigate: (section: Section) => void
  collapsed: boolean
  onToggleCollapse: () => void
  totalCritical: number
  totalWarning: number
  productCount?: number
}

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'DASHBOARD', icon: <MdDashboard className="w-5 h-5" /> },
  { id: 'products', label: 'PRODUCTS', icon: <FiPackage className="w-5 h-5" /> },
  { id: 'review', label: 'ALERT REVIEW', icon: <HiOutlineBell className="w-5 h-5" /> },
  { id: 'history', label: 'ALERT HISTORY', icon: <BiHistory className="w-5 h-5" /> },
  { id: 'settings', label: 'SETTINGS', icon: <HiOutlineCog className="w-5 h-5" /> },
]

export default function SidebarNav({
  activeSection,
  onNavigate,
  collapsed,
  onToggleCollapse,
  totalCritical,
  totalWarning,
  productCount = 0,
}: SidebarNavProps) {
  return (
    <aside
      className={`flex flex-col border-r transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}
      style={{
        background: 'hsl(30 8% 97%)',
        borderColor: 'hsl(30 10% 90%)',
        minHeight: '100vh',
      }}
    >
      <div className="flex items-center justify-between px-4 py-6 border-b" style={{ borderColor: 'hsl(30 10% 90%)' }}>
        {!collapsed && (
          <h1 className="font-serif font-medium text-sm tracking-widest" style={{ color: 'hsl(30 5% 15%)' }}>
            PERFUME LOGISTICS
          </h1>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 transition-colors duration-200 hover:opacity-70"
          style={{ color: 'hsl(30 5% 50%)' }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <>
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            ) : (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeSection === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
              style={{
                background: isActive ? 'hsl(40 30% 45% / 0.1)' : 'transparent',
                color: isActive ? 'hsl(40 30% 45%)' : 'hsl(30 5% 50%)',
                borderRight: isActive ? '2px solid hsl(40 30% 45%)' : '2px solid transparent',
              }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && (
                <span className="font-serif text-xs tracking-widest font-light">{item.label}</span>
              )}
              {!collapsed && item.id === 'review' && totalCritical > 0 && (
                <span
                  className="ml-auto text-xs font-normal px-2 py-0.5"
                  style={{ background: 'hsl(0 50% 45%)', color: '#fff' }}
                >
                  {totalCritical}
                </span>
              )}
              {!collapsed && item.id === 'dashboard' && totalWarning > 0 && (
                <span
                  className="ml-auto text-xs font-normal px-2 py-0.5"
                  style={{ background: 'hsl(40 80% 50%)', color: 'hsl(30 5% 15%)' }}
                >
                  {totalWarning + totalCritical}
                </span>
              )}
              {!collapsed && item.id === 'products' && productCount > 0 && (
                <span
                  className="ml-auto text-xs font-normal px-2 py-0.5"
                  style={{ background: 'hsl(40 30% 45% / 0.15)', color: 'hsl(40 30% 45%)' }}
                >
                  {productCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="px-4 py-4 border-t" style={{ borderColor: 'hsl(30 10% 90%)' }}>
          <p className="text-xs tracking-wider font-serif font-light" style={{ color: 'hsl(30 5% 50%)' }}>
            COMMAND CENTER
          </p>
          <p className="text-xs font-light mt-1" style={{ color: 'hsl(30 5% 70%)' }}>
            v1.0
          </p>
        </div>
      )}
    </aside>
  )
}
