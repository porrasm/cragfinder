import axios from "axios"
import { AreaGrid, Bounds, Coord, Line, MapData, Point } from "./shared"

const BASE_URL = "/api"

export const getAreaGrid = async (): Promise<AreaGrid> => {
  console.log("Getting area grid...")
  const url = `${BASE_URL}/area`
  const response = await axios.get(url)
  return response.data
}

export const getMapData = async (point: Point): Promise<MapData> => {
  console.log(`Getting map data for ${point.x}, ${point.y}...`)
  const url = `${BASE_URL}/map`
  const response = await axios.get(url, { params: { ...point } })
  return response.data
}
