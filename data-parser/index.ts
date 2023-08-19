import { GeoPackage, GeoPackageAPI } from "@ngageoint/geopackage";
import fs from 'graceful-fs'
import proj4 from 'proj4'

const etrs89Tm35fin = '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs';
const wgs84 = '+proj=longlat +datum=WGS84 +no_defs';

type PointGeoJSON = {
  type: string
  coordinates: [number, number]
}
type Point = {
  x: number
  y: number
}

type LineStringGeoJSON = {
  type: string
  coordinates: [number, number][]
}

type LineString = Point[]

type Coord = [number, number]

GeoPackageAPI.open('./datasource/finland.gpkg').then(geoPackage => {
  extractPointsToFile(geoPackage, 'kivi', './datasource/boulders.json')
  extractLineStringsToFile(geoPackage, 'jyrkanne', './datasource/cliffs.json')
  extractLineStringsToFile(geoPackage, 'kalliohalkeama', './datasource/cracks.json')
  geoPackage.close()
})

const parseGeoJson = <T>(geoPackage: GeoPackage, table: string) => {
  console.log(`Parsing geometry from ${table}...`)
  const data: T[] = []

  const featureDao = geoPackage.getFeatureDao(table)
  const iterator = featureDao.queryForEach()
  for (const row of iterator) {
    const feature = featureDao.getRow(row)
    const geometry = feature.geometry
    if (geometry) {
      const geom = geometry.geometry
      const geoJson: T = geom.toGeoJSON() as T

      data.push(geoJson)
    }
  }

  return data
}

const extractPointsToFile = (geoPackage: GeoPackage, table: string, filename: string) => {
  const points: Coord[] = parseGeoJson<PointGeoJSON>(geoPackage, table).map(point => ({
    x: point.coordinates[0],
    y: point.coordinates[1]
  }))
    .filter(isValidPoint)
    .map(pointToLatituteLongitude)

  saveJsonToFile(points, filename)
}

const isValidPoint = (point: Point) => {
  return point.x && point.y && typeof point.x === 'number' && typeof point.y === 'number'
}

const extractLineStringsToFile = (geoPackage: GeoPackage, table: string, filename: string) => {
  const lineStrings: Coord[][] = parseGeoJson<LineStringGeoJSON>(geoPackage, table).map(lineString => lineString.coordinates.map(point => ({
    x: point[0],
    y: point[1]
  })))
    .filter(isValidLineString)
    .map(lineString => lineString.map(pointToLatituteLongitude))

  saveJsonToFile(lineStrings, filename)
}

const isValidLineString = (lineString: LineString) => {
  return lineString.length > 0 && lineString.every(isValidPoint)
}

const saveJsonToFile = (data: any, filename: string) => {
  const jsonData = JSON.stringify(data)
  fs.writeFileSync(filename, jsonData)
  console.log(`JSON data saved to ${filename}`)
}

const pointToLatituteLongitude = (point: Point): Coord => {
  const transformed = proj4(etrs89Tm35fin, wgs84, [point.x, point.y])
  return [to5Decimals(transformed[1]), to5Decimals(transformed[0])]
}

const to5Decimals = (num: number) => {
  return Math.round((num + Number.EPSILON) * 100000) / 100000
}
