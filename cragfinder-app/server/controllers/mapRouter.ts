import { Router } from 'express'
import { AvailableMapType, MapConfig } from '../shared'
import axios from 'axios'

const MML_API_KEY = process.env.MML_API_KEY

const MAP_CONFIG: MapConfig = {
  'openstreetmap': (x, y, z) => `redundant`,
  'mml_terrain': (x, y, z) => `https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/maastokartta/default/WGS84_Pseudo-Mercator/${z}/${y}/${x}.png?api-key=${MML_API_KEY}`,
  'mml_satellite': (x, y, z) => `https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/ortokuva/default/WGS84_Pseudo-Mercator/${z}/${y}/${x}.png?api-key=${MML_API_KEY}`,
  'mml_background': (x, y, z) => `https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/taustakartta/default/WGS84_Pseudo-Mercator/${z}/${y}/${x}.png?api-key=${MML_API_KEY}`,
  'mml_simple': (x, y, z) => `https://avoin-karttakuva.maanmittauslaitos.fi/avoin/wmts/1.0.0/selkokartta/default/WGS84_Pseudo-Mercator/${z}/${y}/${x}.png?api-key=${MML_API_KEY}`,
}

const router = Router()

// query parameter map

router.get('/tile/:z/:x/:y', async (req, res) => {
  const mapType = req.query.map as AvailableMapType

  const x = Number(req.params.x)
  const y = Number(req.params.y)
  const z = Number(req.params.z)

  console.log(`mapType: ${mapType}, x: ${x}, y: ${y}, z: ${z}`)

  if (!mapType) {
    res.status(400).send()
    return
  }

  const mapUrlFunc = MAP_CONFIG[mapType]

  if (!mapUrlFunc) {
    res.status(404).send()
    return
  }

  // relay response from external api and return it back
  const mapUrl = mapUrlFunc(x, y, z)
  const response = await axios.get(mapUrl, { responseType: 'arraybuffer' })
  res.set('Content-Type', response.headers['content-type'])
  res.send(response.data)
})

export default router
