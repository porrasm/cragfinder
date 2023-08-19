import { Router } from 'express'
import { promises as fs } from 'fs'
import { AreaGrid, Bounds, Coord, LAT_COUNT, LNG_COUNT, Line, MapData, Point, findPartitionOfPoint, getBoundsGridCells } from '../shared'

type GridCellData<T> = {
  data: T[]
}[][]

type FullPartitionedData = MapData[][]

const router = Router()

let areaGrid: AreaGrid = []
let partitionedData: FullPartitionedData = []

router.get('/area', async (req, res) => {
  try {
    res.json(areaGrid)
  } catch (e) {
    console.log(e)
    res.status(500).send()
  }
})

router.get('/map', async (req, res) => {
  try {
    const point = pointFromQuery(req.query)

    if (point) {
      const data = partitionedData[point.x][point.y]
      res.json(data)
      return
    }

    res.status(400).send()
  } catch (e) {
    console.log(e)
    res.status(500).send()
  }
})

const pointFromQuery = (query: any): Point | undefined => {
  if (query.x !== undefined && query.y !== undefined) {
    return {
      x: Number(query.x),
      y: Number(query.y)
    }
  }
}

const getPath = (region: string, type: string) => `./data/${region}/${type}.json`

const loadJson = async <T>(path: string): Promise<T | undefined> => {
  try {
    const json = await fs.readFile(path, 'utf8')
    return JSON.parse(json) as T
  } catch (e) {
    console.log(e)
    return undefined
  }
}

const loadInitialData = async () => {
  const initialBoulders = (await loadJson<Coord[]>('./data/finland/boulders.json'))?.filter(b => b.length == 2)
  const initialCliffs = (await loadJson<Line[]>('./data/finland/cliffs.json'))?.filter(c => c.length > 0)
  const initialCracks = (await loadJson<Line[]>('./data/finland/cracks.json'))?.filter(c => c.length > 0)

  if (!initialBoulders?.length || !initialCliffs?.length || !initialCracks?.length) {
    console.log('Data not loaded')
    return
  }

  initAreaGrid([...initialBoulders, ...initialCliffs.map(c => c[0]), ...initialCracks.map(c => c[0])])

  console.log('Area grid initialized')

  const partitionedBoulders = partitionDataToBounds<Coord>(initialBoulders, p => p)
  const partitionedCliffs = partitionDataToBounds<Line>(initialCliffs, l => l[0])
  const partitionedCracks = partitionDataToBounds<Line>(initialCracks, l => l[0])

  partitionedData = []

  for (let x = 0; x < LAT_COUNT; x++) {
    partitionedData.push([])
    for (let y = 0; y < LNG_COUNT; y++) {
      partitionedData[x].push({
        boulders: partitionedBoulders[x][y].data,
        cliffs: partitionedCliffs[x][y].data,
        cracks: partitionedCracks[x][y].data
      })
    }
  }

  console.log('Data loaded')
}

const partitionDataToBounds = <T>(data: T[], toPoint: (d: T) => Coord): GridCellData<T> => {
  console.log('Partitioning data...')

  const boundedData: GridCellData<T> = []

  for (let x = 0; x < LAT_COUNT; x++) {
    boundedData.push([])
    for (let y = 0; y < LNG_COUNT; y++) {
      boundedData[x].push({
        data: []
      })
    }
  }

  for (const d of data) {
    const point = toPoint(d)
    const [x, y] = findPartitionOfPoint(areaGrid, point)

    boundedData[x][y].data.push(d)
  }

  return boundedData
}

const initAreaGrid = (data: Coord[]) => {
  let minLat = 1000
  let maxLat = -1000
  let minLng = 1000
  let maxLng = -1000

  for (const point of data) {
    minLat = Math.min(minLat, point[0])
    maxLat = Math.max(maxLat, point[0])
    minLng = Math.min(minLng, point[1])
    maxLng = Math.max(maxLng, point[1])
  }

  const latStep = (maxLat - minLat) / LAT_COUNT
  const lngStep = (maxLng - minLng) / LNG_COUNT

  areaGrid = []

  for (let x = 0; x < LAT_COUNT; x++) {
    const latValue = minLat + latStep * x
    const latValueEnd = minLat + latStep * (x + 1)

    areaGrid.push([])

    for (let y = 0; y < LNG_COUNT; y++) {
      const lngValue = minLng + lngStep * y
      const lngValueEnd = minLng + lngStep * (y + 1)

      const bounds: Bounds = {
        lat0: latValue,
        lat1: latValueEnd,
        lng0: lngValue,
        lng1: lngValueEnd
      }

      areaGrid[x].push(bounds)
    }
  }
}

loadInitialData()

export default router
