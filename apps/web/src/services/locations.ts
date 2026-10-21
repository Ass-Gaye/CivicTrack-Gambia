import { api } from '@/lib/api'
import type { LocalGovernmentArea, LocationItem } from '@/types'

// Static fallback LGA definitions adhering strictly to the official eight LGAs
export const OFFICIAL_LGAS: LocalGovernmentArea[] = [
  {
    id: 'banjul',
    code: 'BCC',
    name: 'Banjul City Council',
    councilType: 'City Council',
    administrativeRegion: 'Greater Banjul Area',
  },
  {
    id: 'kanifing',
    code: 'KMC',
    name: 'Kanifing Municipal Council',
    councilType: 'Municipal Council',
    administrativeRegion: 'Greater Banjul Area',
  },
  {
    id: 'brikama',
    code: 'BAC',
    name: 'Brikama Area Council',
    councilType: 'Area Council',
    administrativeRegion: 'West Coast Region',
  },
  {
    id: 'mansakonko',
    code: 'MKAC',
    name: 'Mansakonko Area Council',
    councilType: 'Area Council',
    administrativeRegion: 'Lower River Region',
  },
  {
    id: 'kerewan',
    code: 'KAC',
    name: 'Kerewan Area Council',
    councilType: 'Area Council',
    administrativeRegion: 'North Bank Region',
  },
  {
    id: 'kuntaur',
    code: 'KUNTAUR',
    name: 'Kuntaur Area Council',
    councilType: 'Area Council',
    administrativeRegion: 'Central River Region (North)',
  },
  {
    id: 'janjanbureh',
    code: 'JAC',
    name: 'Janjanbureh Area Council',
    councilType: 'Area Council',
    administrativeRegion: 'Central River Region (South)',
  },
  {
    id: 'basse',
    code: 'BSAC',
    name: 'Basse Area Council',
    councilType: 'Area Council',
    administrativeRegion: 'Upper River Region',
  },
]

export async function getLgas(): Promise<LocalGovernmentArea[]> {
  try {
    const res = await api.get<{ data: LocalGovernmentArea[] }>('/api/locations/lgas')
    if (Array.isArray(res.data.data) && res.data.data.length > 0) {
      return res.data.data
    }
  } catch {
    // Graceful fallback to static definitions
  }
  return OFFICIAL_LGAS
}

export async function getLocations(lgaId?: string, search?: string): Promise<LocationItem[]> {
  const params: Record<string, string> = {}
  if (lgaId) params.lga = lgaId
  if (search) params.search = search

  const res = await api.get<{ data: LocationItem[] }>('/api/locations', { params })
  return res.data.data
}
