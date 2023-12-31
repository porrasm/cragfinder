export const LAT_COUNT = 25
export const LNG_COUNT = 25

export type Coord = [number, number]
export type Line = Coord[]
export type Bounds = {
  lat0: number
  lng0: number
  lat1: number
  lng1: number
}
export type AreaGrid = Bounds[][]

export type Point = {
  x: number
  y: number
}

export type MapDataType = 'boulder' | 'cliff' | 'crack'

export type MapData = {
  boulders: Coord[]
  cliffs: Line[]
  cracks: Line[]
}

export const findPartitionOfPoint = <T>(areaGrid: AreaGrid, point: Coord): [number, number] => {
  let x = -1
  let y = -1

  for (let latX = 0; latX < LAT_COUNT; latX++) {
    const minLat = areaGrid[latX][0].lat0
    const maxLat = areaGrid[latX][0].lat1

    if (point[0] >= minLat && point[0] <= maxLat) {
      x = latX
      break
    }
  }

  for (let lngY = 0; lngY < LNG_COUNT; lngY++) {
    const minLng = areaGrid[0][lngY].lng0
    const maxLng = areaGrid[0][lngY].lng1

    if (point[1] >= minLng && point[1] <= maxLng) {
      y = lngY
      break
    }
  }

  if (point[0] > areaGrid[LAT_COUNT - 1][0].lat1) {
    x = LAT_COUNT
  }

  if (point[1] > areaGrid[0][LNG_COUNT - 1].lng1) {
    y = LNG_COUNT
  }

  return [x, y]
}

export const getBoundsGridCells = (areaGrid: AreaGrid, bounds: Bounds): [number, number][] => {
  const minXMinY = findPartitionOfPoint(areaGrid, [bounds.lat0, bounds.lng0])
  const maxXMaxY = findPartitionOfPoint(areaGrid, [bounds.lat1, bounds.lng1])

  const cells: [number, number][] = []

  for (let x = minXMinY[0]; x <= maxXMaxY[0]; x++) {
    for (let y = minXMinY[1]; y <= maxXMaxY[1]; y++) {

      // We handle the case where the point is outside the bounds
      // because the findPartitionOfPoint function returns 
      // an out of bounds index in the case where the point is outside the bounds
      if (x < 0 || y < 0 || x >= LAT_COUNT || y >= LNG_COUNT) {
        continue
      }

      cells.push([x, y])
    }
  }

  return cells
}

export const AVAILABLE_MAPS = ['openstreetmap', 'mml_terrain', 'mml_satellite', 'mml_background', 'mml_simple'] as const
export type AvailableMapType = typeof AVAILABLE_MAPS[number]

export type LeafletMapConfig = Record<AvailableMapType, string>
export type MapTileUrlCreator = (x: number, y: number, z: number) => string
export type MapConfig = Record<AvailableMapType, MapTileUrlCreator>

export const distance = (p1: Coord, p2: Coord) => {
  const lat1 = p1[0]
  const lat2 = p2[0]
  const lon1 = p1[1]
  const lon2 = p2[1]

  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}

export const lineLength = (line: Line) => {
  let length = 0

  for (let i = 1; i < line.length; i++) {
    length += distance(line[i - 1], line[i])
  }

  return length
}

export const boundsContainsPoint = (bounds: Bounds, point: Coord) => {
  return bounds.lat0 <= point[0] && bounds.lat1 >= point[0] && bounds.lng0 <= point[1] && bounds.lng1 >= point[1]
}
