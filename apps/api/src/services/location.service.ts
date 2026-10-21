import rawLocationsData from '../data/gambia-locations.json'

export interface LocalGovernmentArea {
  id: string
  code: string
  name: string
  councilType: 'City Council' | 'Municipal Council' | 'Area Council'
  administrativeRegion: string
}

export type LocationType = 'town' | 'village' | 'neighborhood' | 'street' | 'landmark'

export interface LocationItem {
  id: string
  name: string
  type: LocationType
  lgaId: string
  latitude?: number
  longitude?: number
  source: 'GeoNames' | 'OpenStreetMap'
}

export interface DatasetMetadata {
  title: string
  version: string
  generatedAt: string
  sources: Array<{
    name: string
    description: string
    url: string
    license: string
    licenseUrl: string
    copyright?: string
  }>
  coverageLimitations: string
  totalLocations: number
  lgasCount: number
}

interface RawDataStructure {
  metadata: DatasetMetadata
  lgas: LocalGovernmentArea[]
  locations: LocationItem[]
}

const data = rawLocationsData as RawDataStructure

const lgasMap = new Map<string, LocalGovernmentArea>()
const locationsMap = new Map<string, LocationItem>()
const lgaLocationsMap = new Map<string, LocationItem[]>()

// Index in memory for instant lookups
for (const lga of data.lgas) {
  lgasMap.set(lga.id.toLowerCase(), lga)
  lgasMap.set(lga.code.toLowerCase(), lga)
  lgaLocationsMap.set(lga.id.toLowerCase(), [])
}

for (const loc of data.locations) {
  locationsMap.set(loc.id, loc)
  const list = lgaLocationsMap.get(loc.lgaId.toLowerCase())
  if (list) {
    list.push(loc)
  }
}

export function getDatasetMetadata(): DatasetMetadata {
  return data.metadata
}

export function getAllLgas(): LocalGovernmentArea[] {
  return data.lgas
}

export function getLgaById(identifier: string): LocalGovernmentArea | null {
  if (!identifier) return null
  return lgasMap.get(identifier.trim().toLowerCase()) ?? null
}

export function getLocationById(id: string): LocationItem | null {
  if (!id) return null
  return locationsMap.get(id.trim()) ?? null
}

export interface FilterLocationsOptions {
  lga?: string
  search?: string
  type?: LocationType
  limit?: number
}

export function getLocations(options?: FilterLocationsOptions): LocationItem[] {
  let list: LocationItem[] = []

  if (options?.lga) {
    const lga = getLgaById(options.lga)
    if (!lga) return []
    list = lgaLocationsMap.get(lga.id.toLowerCase()) ?? []
  } else {
    list = data.locations
  }

  if (options?.type) {
    list = list.filter((item) => item.type === options.type)
  }

  if (options?.search) {
    const query = options.search.trim().toLowerCase()
    list = list.filter((item) => item.name.toLowerCase().includes(query))
  }

  if (options?.limit && options.limit > 0) {
    return list.slice(0, options.limit)
  }

  return list
}

export interface LocationValidationResult {
  valid: boolean
  error?: string
  lga?: LocalGovernmentArea
  locationItem?: LocationItem
  resolvedName?: string
}

export function validateLocation(input: {
  lga?: string | null
  locationId?: string | null
  location?: string | null
  customLocation?: string | null
}): LocationValidationResult {
  // If LGA is provided, it must be valid
  if (input.lga) {
    const lga = getLgaById(input.lga)
    if (!lga) {
      return {
        valid: false,
        error: `Invalid Region / Local Government Area: "${input.lga}". Must be one of the eight official LGAs.`,
      }
    }

    // If locationId is OTHER, citizen must provide customLocation or non-empty location
    if (input.locationId === 'OTHER') {
      const custom = (input.customLocation || input.location || '').trim()
      if (!custom || custom.length < 2) {
        return {
          valid: false,
          error: 'Please enter the specific community, street or landmark name for "Other / Not listed".',
        }
      }
      return {
        valid: true,
        lga,
        resolvedName: custom,
      }
    }

    // If locationId is provided (and not OTHER), it must exist and match this LGA
    if (input.locationId) {
      const locationItem = getLocationById(input.locationId)
      if (!locationItem) {
        return {
          valid: false,
          error: `Location ID "${input.locationId}" is not recognized in the verified geographic database.`,
        }
      }

      if (locationItem.lgaId.toLowerCase() !== lga.id.toLowerCase()) {
        const itemLga = getLgaById(locationItem.lgaId)
        return {
          valid: false,
          error: `Location "${locationItem.name}" belongs to ${itemLga?.name ?? locationItem.lgaId}, not ${lga.name}.`,
        }
      }

      return {
        valid: true,
        lga,
        locationItem,
        resolvedName: locationItem.name,
      }
    }

    // If lga is provided but no locationId, fall back to checking freeform location
    const freeform = (input.location || '').trim()
    if (!freeform || freeform.length < 2) {
      return {
        valid: false,
        error: 'Please select or provide a community, street or landmark.',
      }
    }
    return {
      valid: true,
      lga,
      resolvedName: freeform,
    }
  }

  // Legacy case: LGA not provided, just freeform location
  const freeform = (input.location || '').trim()
  if (!freeform || freeform.length < 2) {
    return {
      valid: false,
      error: 'Location must be at least 2 characters.',
    }
  }

  return {
    valid: true,
    resolvedName: freeform,
  }
}
