import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Search, ChevronDown, Check, MapPin, Building, Milestone, Landmark, HelpCircle, X } from 'lucide-react'
import type { LocationItem, LocationType } from '@/types'

interface SearchableLocationSelectProps {
  locations: LocationItem[]
  value?: string // locationId or 'OTHER'
  onChange: (locationId: string, item?: LocationItem) => void
  disabled?: boolean
  loading?: boolean
  error?: string
  placeholder?: string
  lgaName?: string
}

const TYPE_ICONS: Record<LocationType, React.ElementType> = {
  town: Building,
  village: MapPin,
  neighborhood: MapPin,
  street: Milestone,
  landmark: Landmark,
}

const TYPE_LABELS: Record<LocationType, string> = {
  town: 'Town',
  village: 'Village / Settlement',
  neighborhood: 'Neighborhood / Ward',
  street: 'Street / Avenue / Road',
  landmark: 'Public Landmark',
}

const TYPE_BADGES: Record<LocationType, string> = {
  town: 'bg-river-50 text-river-700 border-river-200',
  village: 'bg-canopy-50 text-canopy-700 border-canopy-200',
  neighborhood: 'bg-ochre-50 text-ochre-700 border-ochre-200',
  street: 'bg-sand-100 text-sand-700 border-sand-200',
  landmark: 'bg-purple-50 text-purple-700 border-purple-200',
}

export function SearchableLocationSelect({
  locations,
  value,
  onChange,
  disabled = false,
  loading = false,
  error,
  placeholder = 'Search community, street, village or landmark…',
  lgaName,
}: SearchableLocationSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  // Find currently selected item
  const selectedItem = useMemo(() => {
    if (!value || value === 'OTHER') return null
    return locations.find((l) => l.id === value) || null
  }, [value, locations])

  // Filter locations by search term
  const filteredLocations = useMemo(() => {
    if (!search.trim()) return locations
    const q = search.trim().toLowerCase()
    return locations.filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.type.toLowerCase().includes(q)
    )
  }, [search, locations])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setHighlightedIndex(0)
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    // Total options = filteredLocations.length + 1 ("OTHER" option)
    const totalCount = filteredLocations.length + 1

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % totalCount)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 + totalCount) % totalCount)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex === filteredLocations.length) {
        // "OTHER" option selected
        onChange('OTHER')
        setIsOpen(false)
      } else if (filteredLocations[highlightedIndex]) {
        const item = filteredLocations[highlightedIndex]
        onChange(item.id, item)
        setIsOpen(false)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (!isOpen || !listRef.current) return
    const activeEl = listRef.current.children[highlightedIndex] as HTMLElement
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, isOpen])

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-sm font-semibold text-sand-800">
          Community, Street or Landmark <span className="text-red-500">*</span>
        </label>
        {lgaName && (
          <span className="text-xs text-sand-500 font-medium">
            {loading ? 'Loading…' : `${locations.length} verified in ${lgaName}`}
          </span>
        )}
      </div>

      {/* Main trigger button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left text-sm font-medium transition-all duration-150 ${
          disabled
            ? 'bg-sand-100/60 border-sand-200 text-sand-400 cursor-not-allowed'
            : isOpen
              ? 'bg-white border-river-500 ring-2 ring-river-500/20 text-sand-900 shadow-sm'
              : error
                ? 'bg-white border-red-400 text-sand-900 focus:ring-2 focus:ring-red-400/20'
                : 'bg-white border-sand-300 text-sand-900 hover:border-sand-400 shadow-sm'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 truncate">
          <MapPin className={`w-4 h-4 flex-shrink-0 ${value ? 'text-river-600' : 'text-sand-400'}`} />
          {value === 'OTHER' ? (
            <span className="font-semibold text-river-900 flex items-center gap-1.5">
              <span>Other / Not listed</span>
              <span className="text-[11px] font-normal text-sand-500">(Provide manual details)</span>
            </span>
          ) : selectedItem ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-sand-900 truncate">{selectedItem.name}</span>
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                  TYPE_BADGES[selectedItem.type] || 'bg-sand-100 text-sand-700 border-sand-200'
                }`}
              >
                {selectedItem.type}
              </span>
            </div>
          ) : (
            <span className="text-sand-400">{disabled ? 'Select a Region / LGA first' : placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 text-sand-400">
          {loading ? (
            <div className="w-4 h-4 border-2 border-river-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-river-600' : ''}`} />
          )}
        </div>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-sand-300 rounded-2xl shadow-elevated overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search box inside popover */}
          <div className="p-2.5 border-b border-sand-200 bg-sand-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-sand-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setHighlightedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Search in ${lgaName || 'selected area'}…`}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-sand-300 bg-white text-sand-900 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-river-500 font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-sand-400 hover:text-sand-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Location results list */}
          <ul
            ref={listRef}
            className="max-h-64 overflow-y-auto divide-y divide-sand-100 py-1 text-xs"
            role="listbox"
          >
            {filteredLocations.map((item, index) => {
              const isSelected = value === item.id
              const isHighlighted = highlightedIndex === index
              const Icon = TYPE_ICONS[item.type] || MapPin

              return (
                <li
                  key={item.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(item.id, item)
                    setIsOpen(false)
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isHighlighted
                      ? 'bg-river-50/80 text-river-950'
                      : isSelected
                        ? 'bg-sand-50 font-semibold text-river-900'
                        : 'text-sand-800 hover:bg-sand-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-river-900 text-white'
                          : isHighlighted
                            ? 'bg-river-200 text-river-800'
                            : 'bg-sand-100 text-sand-500'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <div className="font-semibold text-sand-900 truncate">{item.name}</div>
                      <div className="text-[11px] text-sand-500 flex items-center gap-1.5">
                        <span>{TYPE_LABELS[item.type] || item.type}</span>
                        <span>•</span>
                        <span className="italic">{item.source}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                        TYPE_BADGES[item.type] || 'bg-sand-100 text-sand-700 border-sand-200'
                      }`}
                    >
                      {item.type}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-river-700 flex-shrink-0" />}
                  </div>
                </li>
              )
            })}

            {filteredLocations.length === 0 && (
              <li className="px-4 py-4 text-center text-xs text-sand-500">
                No verified location matched "{search}".
                <div className="mt-1 font-semibold text-river-700">
                  Select "Other / Not listed" below to enter your location manually.
                </div>
              </li>
            )}

            {/* Special Other / Not Listed option */}
            <li
              role="option"
              aria-selected={value === 'OTHER'}
              onClick={() => {
                onChange('OTHER')
                setIsOpen(false)
              }}
              onMouseEnter={() => setHighlightedIndex(filteredLocations.length)}
              className={`px-3.5 py-3 flex items-center justify-between cursor-pointer border-t border-sand-200 ${
                highlightedIndex === filteredLocations.length
                  ? 'bg-ochre-50/90 text-ochre-950'
                  : value === 'OTHER'
                    ? 'bg-ochre-50 font-semibold text-ochre-900'
                    : 'bg-sand-50/60 text-sand-800 hover:bg-ochre-50/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-ochre-100 border border-ochre-200 flex items-center justify-center text-ochre-700 flex-shrink-0">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-sand-900">Other / Not listed</div>
                  <div className="text-[11px] text-sand-500">
                    Location missing? Type the exact street, compound, or landmark name manually.
                  </div>
                </div>
              </div>
              {value === 'OTHER' && <Check className="w-4 h-4 text-ochre-700 flex-shrink-0" />}
            </li>
          </ul>

          {/* Dataset attribution footer */}
          <div className="px-3.5 py-2 bg-sand-100/70 border-t border-sand-200 text-[10px] text-sand-500 flex items-center justify-between">
            <span>Data verified via GeoNames & OpenStreetMap</span>
            <span>CC BY 4.0 & ODbL</span>
          </div>
        </div>
      )}

      {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}
