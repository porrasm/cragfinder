import axios from "axios"
import { AreaGrid, Bounds, Coord, Line, MapData, Point } from "./shared"
import { orderBy } from "lodash"

const BASE_URL = "/api"

type CachedRequest<T> = {
  data: T | undefined
  cachedAt: number
  objectCount: number
}

type MapDataCache = {
  totalObjectCount: number
  cachedRequests: Record<string, CachedRequest<MapData>>
}
const MAX_OBJECT_COUNT = 250000
const MAP_DATA_CACHE: MapDataCache = {
  totalObjectCount: 0,
  cachedRequests: {},
}

const getMapDataObjectCount = (mapData: MapData): number => {
  return mapData.boulders.length + mapData.cliffs.length + mapData.cracks.length
}

const clearMapDataCache = () => {
  const objectsToClear = MAP_DATA_CACHE.totalObjectCount - MAX_OBJECT_COUNT

  if (objectsToClear <= 0) {
    return
  }

  console.log(`Clearing ${objectsToClear} objects from cache`)

  const keysOrderedByCachedAt = orderBy(Object.keys(MAP_DATA_CACHE.cachedRequests), (key) => MAP_DATA_CACHE.cachedRequests[key].cachedAt)

  const keysToRemove: string[] = []

  let objectsCleared = 0
  for (let i = 0; i < keysOrderedByCachedAt.length; i++) {
    const key = keysOrderedByCachedAt[i]

    objectsCleared += MAP_DATA_CACHE.cachedRequests[key].objectCount
    keysToRemove.push(key)

    if (objectsCleared >= objectsToClear) {
      break
    }
  }

  keysToRemove.forEach((key) => {
    MAP_DATA_CACHE.totalObjectCount -= MAP_DATA_CACHE.cachedRequests[key].objectCount
    delete MAP_DATA_CACHE.cachedRequests[key]
  })
}

export const getAreaGrid = async (): Promise<AreaGrid> => {
  const url = `${BASE_URL}/area`
  const response = await axios.get(url)
  return response.data
}

export const getCracks = async (): Promise<Line[]> => {
  const url = `${BASE_URL}/cracks`
  const response = await axios.get(url)
  return response.data
}

export const getMapData = async (point: Point, fetchFrom: 'cache' | 'cacheOrServer'): Promise<MapData | undefined> => {
  console.log(`Fetching map data for ${point.x},${point.y}`)
  const url = `${BASE_URL}/map`
  const key = `${point.x},${point.y}`

  if (MAP_DATA_CACHE.cachedRequests[key]) {
    const data = MAP_DATA_CACHE.cachedRequests[key].data
    if (data) {
      return data
    }

    for (let i = 0; i < 50; i++) {
      const data = MAP_DATA_CACHE.cachedRequests[key].data
      if (data) {
        return data
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return undefined
  }

  if (fetchFrom === 'cache') {
    return undefined
  }

  MAP_DATA_CACHE.cachedRequests[key] = {
    data: undefined,
    objectCount: 0,
    cachedAt: Date.now(),
  }
  const response = await axios.get(url, { params: { ...point } })
  const mapData = response.data

  const objectCount = getMapDataObjectCount(mapData)
  MAP_DATA_CACHE.totalObjectCount += objectCount

  MAP_DATA_CACHE.cachedRequests[key] = {
    data: mapData,
    objectCount: objectCount,
    cachedAt: Date.now(),
  }


  console.log(`Cached ${objectCount} objects for ${key} (total: ${MAP_DATA_CACHE.totalObjectCount}))`)

  clearMapDataCache()

  return mapData
}
