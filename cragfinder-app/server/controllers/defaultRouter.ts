import { Router } from 'express'
import { promises as fs } from 'fs'

const LAT_COUNT = 25
const LNG_COUNT = 25

type BoundedSingle<T> = {
  bounds: Bounds
  data: T[]
}

type BoundPartitioned<T> = BoundedSingle<T>[][]

const findPartitionOfPoint = <T>(data: BoundPartitioned<T>, point: Coord): [number, number] => {
  let x = -1
  let y = -1

  for (let latX = 0; latX < LAT_COUNT; latX++) {
    const minLat = data[latX][0].bounds.lat0
    const maxLat = data[latX][0].bounds.lat1

    if (point[0] >= minLat && point[0] <= maxLat) {
      x = latX
      break
    }
  }

  for (let lngY = 0; lngY < LNG_COUNT; lngY++) {
    const minLng = data[0][lngY].bounds.lng0
    const maxLng = data[0][lngY].bounds.lng1

    if (point[1] >= minLng && point[1] <= maxLng) {
      y = lngY
      break
    }
  }

  if (point[0] > data[LAT_COUNT - 1][0].bounds.lat1) {
    x = LAT_COUNT
  }

  if (point[1] > data[0][LNG_COUNT - 1].bounds.lng1) {
    y = LNG_COUNT
  }

  return [x, y]
}

const findDataInBounds = <T>(data: BoundPartitioned<T>, bounds: Bounds): T[] => {
  console.log('Finding data in bounds: ', bounds)

  const minXMinY = findPartitionOfPoint(data, [bounds.lat0, bounds.lng0])
  const maxXMaxY = findPartitionOfPoint(data, [bounds.lat1, bounds.lng1])

  const dataInBounds: T[] = []

  for (let x = minXMinY[0]; x <= maxXMaxY[0]; x++) {
    for (let y = minXMinY[1]; y <= maxXMaxY[1]; y++) {

      // We handle the case where the point is outside the bounds
      // because the findPartitionOfPoint function returns 
      // an out of bounds index in the case where the point is outside the bounds
      if (x < 0 || y < 0 || x >= LAT_COUNT || y >= LNG_COUNT) {
        continue
      }

      dataInBounds.push(...data[x][y].data)
    }
  }

  return dataInBounds
}

let partitionedBoulders: BoundPartitioned<Coord> = []
let partitionedCliffs: BoundPartitioned<Line> = []
let partitionedCracks: BoundPartitioned<Line> = []

const router = Router()

type Coord = [number, number]

type Line = Coord[]

type Bounds = {
  lat0: number
  lng0: number
  lat1: number
  lng1: number
}

type ReqBody = {
  bounds: Bounds
}

const boundsFromQuery = (query: any): Bounds | undefined => {
  if (query.lat0 && query.lng0 && query.lat1 && query.lng1) {
    return {
      lat0: Number(query.lat0),
      lng0: Number(query.lng0),
      lat1: Number(query.lat1),
      lng1: Number(query.lng1)
    }
  }
}


router.get('/:region/boulders', async (req, res) => {
  try {
    const region = req.params.region

    const bounds = boundsFromQuery(req.query)
    console.log('Boulders request params: ', bounds)

    if (bounds) {
      res.json(findDataInBounds(partitionedBoulders, bounds))
      return
    }

    const path = getPath(region, 'boulders')
    const boulders: Coord[] | undefined = await loadJson(path)
    res.json(boulders)
  } catch (e) {
    console.log(e)
    res.status(500).send()
  }
})

router.get('/:region/cliffs', async (req, res) => {
  try {
    const region = req.params.region

    const bounds = boundsFromQuery(req.query)

    if (bounds) {
      res.json(findDataInBounds(partitionedCliffs, bounds))
      return
    }

    const path = getPath(region, 'cliffs')
    const cliffs: Line[] | undefined = await loadJson(path)
    res.json(cliffs)
  } catch (e) {
    console.log(e)
    res.status(500).send()
  }
})

router.get('/:region/cracks', async (req, res) => {
  try {
    const region = req.params.region

    const bounds = boundsFromQuery(req.query)

    if (bounds) {
      res.json(findDataInBounds(partitionedCracks, bounds))
      return
    }

    const path = getPath(region, 'cracks')
    const cracks: Line[] | undefined = await loadJson(path)
    res.json(cracks)
  } catch (e) {
    console.log(e)
    res.status(500).send()
  }
})

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

  if (initialBoulders?.length) {
    console.log('Boulders loaded')
    partitionedBoulders = partitionDataToBounds<Coord>(initialBoulders, p => p)
  }

  if (initialCliffs?.length) {
    console.log('Cliffs loaded')
    partitionedCliffs = partitionDataToBounds<Line>(initialCliffs, l => l[0])
  }

  if (initialCracks?.length) {
    console.log('Cracks loaded')
    partitionedCracks = partitionDataToBounds<Line>(initialCracks, l => l[0])
  }

  console.log('Data loaded')
}

const partitionDataToBounds = <T>(data: T[], toPoint: (d: T) => Coord): BoundPartitioned<T> => {
  console.log('Partitioning data...')

  let minLat = 1000
  let maxLat = -1000
  let minLng = 1000
  let maxLng = -1000

  for (const d of data) {
    const point = toPoint(d)
    minLat = Math.min(minLat, point[0])
    maxLat = Math.max(maxLat, point[0])
    minLng = Math.min(minLng, point[1])
    maxLng = Math.max(maxLng, point[1])
  }

  const latStep = (maxLat - minLat) / LAT_COUNT
  const lngStep = (maxLng - minLng) / LNG_COUNT

  const boundedData: BoundPartitioned<T> = []

  for (let x = 0; x < LAT_COUNT; x++) {
    const latValue = minLat + latStep * x
    const latValueEnd = minLat + latStep * (x + 1)

    boundedData.push([])

    for (let y = 0; y < LNG_COUNT; y++) {
      const lngValue = minLng + lngStep * y
      const lngValueEnd = minLng + lngStep * (y + 1)

      const bounds: Bounds = {
        lat0: latValue,
        lat1: latValueEnd,
        lng0: lngValue,
        lng1: lngValueEnd
      }

      boundedData[x].push({
        bounds,
        data: []
      })
    }
  }

  for (const d of data) {
    const point = toPoint(d)
    const [x, y] = findPartitionOfPoint(boundedData, point)

    //console.log({ point, x, y, minLat, maxLat, minLng, maxLng, latStep, lngStep })

    boundedData[x][y].data.push(d)
  }

  return boundedData
}

loadInitialData()

export default router
