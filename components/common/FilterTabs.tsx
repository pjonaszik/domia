// /components/common/FilterTabs.tsx
// Responsive filter tabs component

'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import '@fortawesome/fontawesome-free/css/all.min.css'

export type FilterType = 'all' | 'pending' | 'accepted' | 'declined' | 'in_progress' | 'completed_pending_validation' | 'needs_correction' | 'completed_validated'

interface FilterOption {
    value: FilterType
    labelKey: string
    section?: 'offers' | 'missions'
}

interface FilterTabsProps {
    filters: FilterOption[]
    currentFilter: FilterType
    onFilterChange: (filter: FilterType) => void
    type?: 'offers' | 'missions'
}

export function FilterTabs({ filters, currentFilter, onFilterChange, type = 'missions' }: FilterTabsProps) {
    const { t } = useLanguage()
    const [showDropdown, setShowDropdown] = useState(false)

    const getLabel = (labelKey: string, section?: string) => {
        const sectionKey = section || type
        return t(`${sectionKey}.${labelKey}`)
    }

    return (
        <div className="w-full max-w-full overflow-x-hidden overflow-y-visible">
            {/* Desktop/Tablet: Horizontal scrollable tabs */}
            <div className="hidden md:flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {filters.map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => onFilterChange(filter.value)}
                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-semibold whitespace-nowrap transition-colors text-xs sm:text-sm flex-shrink-0 ${
                            currentFilter === filter.value
                                ? 'bg-[var(--primary)] text-white'
                                : 'bg-white text-[var(--primary)] border-2 border-[var(--primary)]'
                        }`}
                    >
                        {getLabel(filter.labelKey, filter.section)}
                    </button>
                ))}
            </div>

            {/* Tablet/Mobile: Dropdown */}
            <div className="md:hidden relative z-50">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full px-4 py-3 bg-white border-2 border-[var(--primary)] rounded-lg font-semibold text-[var(--primary)] flex items-center justify-between"
                >
                    <span className="truncate">{getLabel(filters.find(f => f.value === currentFilter)?.labelKey || 'all', filters.find(f => f.value === currentFilter)?.section)}</span>
                    <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'} transition-transform flex-shrink-0 ml-2`} aria-hidden="true"></i>
                </button>
                
                {showDropdown && (
                    <>
                        <div 
                            className="fixed inset-0 z-[45]" 
                            onClick={() => setShowDropdown(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[var(--primary)] rounded-lg shadow-lg z-[50] max-h-64 overflow-y-auto">
                            {filters.map((filter) => (
                                <button
                                    key={filter.value}
                                    onClick={() => {
                                        onFilterChange(filter.value)
                                        setShowDropdown(false)
                                    }}
                                    className={`w-full text-left px-4 py-3 font-semibold transition-colors ${
                                        currentFilter === filter.value
                                            ? 'bg-[var(--primary)] text-white'
                                            : 'text-[var(--primary)] hover:bg-gray-50'
                                    } ${filter.value !== filters[0].value ? 'border-t border-gray-200' : ''}`}
                                >
                                    {getLabel(filter.labelKey, filter.section)}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

