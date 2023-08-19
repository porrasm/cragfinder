import axios from "axios"
import { AreaGrid, Bounds, Coord, Line, MapData, Point } from "./shared"

const BASE_URL = "/api"

export const getAreaGrid = async (): Promise<AreaGrid> => {
  const url = `${BASE_URL}/area`
  const response = await axios.get(url)
  return response.data
}

export const getMapData = async (point: Point): Promise<MapData> => {
  const url = `${BASE_URL}/map`
  const response = await axios.get(url, { params: { ...point } })
  return response.data
}

export const getCracks = async (): Promise<Line[]> => {
  const url = `${BASE_URL}/cracks`
  const response = await axios.get(url)
  return response.data
}
