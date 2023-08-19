import { Router } from 'express'
import { promises as fs } from 'fs'

const router = Router()

type Coord = {
  lat: number
  lng: number
}

type Point = Coord[]

type Line = Point[]

router.get('/:region/boulders', async (req, res) => {
  console.log('boulders')
  const region = req.params.region
  const path = getPath(region, 'boulders')
  const boulders: Point[] = await loadJson(path)
  res.json(boulders)
})

router.get('/:region/cliffs', async (req, res) => {
  const region = req.params.region
  const path = getPath(region, 'cliffs')
  const cliffs: Line[] = await loadJson(path)
  res.json(cliffs)
})

router.get('/:region/cracks', async (req, res) => {
  const region = req.params.region
  const path = getPath(region, 'cracks')
  const cracks: Line[] = await loadJson(path)
  res.json(cracks)
})

const getPath = (region: string, type: string) => `./data/${region}/${type}.json`

const loadJson = async <T>(path: string): Promise<T> => {
  console.log(`Loading ${path}`)
  const json = await fs.readFile(path, 'utf8')
  console.log(`${json}`)
  return JSON.parse(json) as T
}

export default router
