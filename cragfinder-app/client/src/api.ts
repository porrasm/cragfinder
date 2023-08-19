import axios from "axios"
import { Coord, Line } from "./types"

const DEFAULT_REGION = "finland"
const BASE_URL = "/api"

export const getBoulders = async (region = DEFAULT_REGION): Promise<Coord[]> => {
  const response = await axios.get(`${BASE_URL}/${region}/boulders`)
  return response.data
}

export const getCliffs = async (region = DEFAULT_REGION): Promise<Line[]> => {
  const response = await axios.get(`${BASE_URL}/${region}/cliffs`)
  return response.data
}

export const getCracks = async (region = DEFAULT_REGION): Promise<Line[]> => {
  const response = await axios.get(`${BASE_URL}/${region}/cracks`)
  return response.data
}
