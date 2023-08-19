import axios from "axios"
import { Bounds, Coord, Line } from "./types"

const DEFAULT_REGION = "finland"
const BASE_URL = "/api"

export const getBoulders = async (bounds: Bounds | undefined = undefined, region = DEFAULT_REGION): Promise<Coord[]> => {
  console.log("getBoulders: ", bounds);
  const url = `${BASE_URL}/${region}/boulders`;
  const params = bounds ? { bounds } : undefined;
  const response = await axios.get(url, { params: { ...bounds } });
  return response.data;
}

export const getCliffs = async (bounds: Bounds | undefined = undefined, region = DEFAULT_REGION): Promise<Line[]> => {
  const url = `${BASE_URL}/${region}/cliffs`;
  const params = bounds ? { bounds } : undefined;
  const response = await axios.get(url, { params: { ...bounds } });
  return response.data;
}

export const getCracks = async (bounds: Bounds | undefined = undefined, region = DEFAULT_REGION): Promise<Line[]> => {
  const url = `${BASE_URL}/${region}/cracks`;
  const params = bounds ? { bounds } : undefined;
  const response = await axios.get(url, { params: { ...bounds } });
  return response.data;
}
