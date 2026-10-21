import { Router, Request, Response } from 'express'
import {
  getAllLgas,
  getLgaById,
  getLocations,
  getLocationById,
  getDatasetMetadata,
  LocationType,
} from '../services/location.service'

const router = Router()

/**
 * GET /api/locations/lgas
 * Returns all eight Local Government Areas (LGAs) of The Gambia
 * with official geographic distinctions (council type, administrative region, council name).
 */
router.get('/lgas', (_req: Request, res: Response) => {
  res.json({ data: getAllLgas() })
})

/**
 * GET /api/locations/metadata
 * Returns dataset attribution, sources, licenses, and coverage limitations.
 */
router.get('/metadata', (_req: Request, res: Response) => {
  res.json({ data: getDatasetMetadata() })
})

/**
 * GET /api/locations
 * Search and filter verified locations across The Gambia.
 * Optional query parameters:
 * - lga: LGA ID or code (e.g. 'banjul', 'kanifing', 'KMC', 'brikama', etc.)
 * - search: text query matching location names
 * - type: filter by location type ('town' | 'village' | 'neighborhood' | 'street' | 'landmark')
 * - limit: max number of results (defaults to all matching)
 */
router.get('/', (req: Request, res: Response) => {
  const lgaParam = typeof req.query.lga === 'string' ? req.query.lga : undefined
  const searchParam = typeof req.query.search === 'string' ? req.query.search : undefined
  const typeParam = typeof req.query.type === 'string' ? (req.query.type as LocationType) : undefined
  const limitParam = req.query.limit ? Number(req.query.limit) : undefined

  if (lgaParam) {
    const lga = getLgaById(lgaParam)
    if (!lga) {
      res.status(404).json({
        error: {
          code: 'LGA_NOT_FOUND',
          message: `Local Government Area "${lgaParam}" was not found. Must be one of the eight official LGAs.`,
        },
      })
      return
    }
  }

  const results = getLocations({
    lga: lgaParam,
    search: searchParam,
    type: typeParam,
    limit: limitParam,
  })

  res.json({ data: results })
})

/**
 * GET /api/locations/:id
 * Retrieve a specific location by its stable ID.
 */
router.get('/:id', (req: Request, res: Response) => {
  const item = getLocationById(req.params.id)
  if (!item) {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Location not found' },
    })
    return
  }

  const lga = getLgaById(item.lgaId)
  res.json({
    data: {
      ...item,
      lgaName: lga?.name ?? item.lgaId,
      councilType: lga?.councilType,
      administrativeRegion: lga?.administrativeRegion,
    },
  })
})

export { router as locationRouter }
