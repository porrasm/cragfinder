import React, { useEffect } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { AreaGrid, Bounds, Coord, Line, MapData, Point, getBoundsGridCells } from "./shared"
import { getAreaGrid, getMapData } from "./api"
import L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster";
import MarkerCluster from "./MarkerCluster";

const MINIMUM_ZOOM = 13
const MAX_AREAS = 7

const linesToCoords = (lines: Line): Coord => {
  // get center of all line positions
  const lat = lines.reduce((acc, cur) => acc + cur[0], 0) / lines.length
  const lng = lines.reduce((acc, cur) => acc + cur[1], 0) / lines.length

  return [lat, lng]
}

const TOGGLES = ['showBoulders', 'showCliffs', 'showCracks', 'allowLocation'] as const
type Toggle = typeof TOGGLES[number]

const toggleLabels: Record<Toggle, string> = {
  showBoulders: 'Boulders',
  showCliffs: 'Cliffs',
  showCracks: 'Cracks',
  allowLocation: 'Allow location'
}

type Options = Record<Toggle, boolean> & {

}

type MapFetchInfo = {
  bounds: L.LatLngBounds
  zoom: number
}

const latLngBoundsToBounds = (latLngBounds: L.LatLngBounds): Bounds => ({
  lat0: latLngBounds.getSouth(),
  lng0: latLngBounds.getWest(),
  lat1: latLngBounds.getNorth(),
  lng1: latLngBounds.getEast()
})

const pointToKey = (point: Point) => `${point.x},${point.y}`
const keyToPoint = (key: string): Point => {
  const [x, y] = key.split(',').map(s => Number(s))
  return { x, y }
}

export const CragfinderMap = () => {
  const [areaGrid, setAreaGrid] = React.useState<AreaGrid>()
  const [mapData, setMapData] = React.useState<MapData>({
    boulders: [],
    cliffs: [],
    cracks: []
  })
  const [fetchedIndexes, setFetchedIndexes] = React.useState<Record<string, boolean>>({})

  const [mapFetch, setMapFetch] = React.useState<MapFetchInfo>(({
    bounds: new L.LatLngBounds([0, 0], [0, 0]),
    zoom: 0,
  }))

  const [options, setOptions] = React.useState<Options>({
    showBoulders: true,
    showCliffs: false,
    showCracks: false,
    allowLocation: false
  })

  const resetData = () => {
    setMapData({
      boulders: [],
      cliffs: [],
      cracks: []
    })
    setFetchedIndexes({})
  }

  useEffect(() => {
    getAreaGrid().then(areaGrid => setAreaGrid(areaGrid))
  }, [])


  const getUserLocation = () => {
    if (!options.allowLocation) {
      return null
    }
    if (!navigator.geolocation) {
      return null
    }
    return navigator.geolocation.getCurrentPosition((position) => {
      return [position.coords.latitude, position.coords.longitude]
    })
  }

  const userLocation = getUserLocation()

  useEffect(() => {
    if (!areaGrid) {
      return
    }

    // fetched indexes count
    if (Object.keys(fetchedIndexes).length > MAX_AREAS) {
      resetData()
    }

    if (mapFetch.zoom < MINIMUM_ZOOM) {
      return
    }

    const bounds = latLngBoundsToBounds(mapFetch.bounds)

    const indexes = getBoundsGridCells(areaGrid, bounds)
      .map(p => pointToKey({
        x: p[0],
        y: p[1]
      }))
      .filter(key => !fetchedIndexes[key])
      .map(keyToPoint)

    const fetchNewData = async () => {
      for (const point of indexes) {
        const data = await getMapData(point)
        setMapData({
          boulders: [...mapData.boulders, ...data.boulders],
          cliffs: [...mapData.cliffs, ...data.cliffs],
          cracks: [...mapData.cracks, ...data.cracks]
        })
        setFetchedIndexes({ ...fetchedIndexes, [pointToKey(point)]: true })
      }
    }

    fetchNewData()

    if (indexes.length === 0) {
      console.log('No new indexes to fetch')
      return
    }

  }, [mapFetch.bounds])

  if (!areaGrid) {
    return <div>Loading...</div>
  }

  const getFilteredBoulders = () => {
    if (!options.showBoulders) {
      return []
    }
    return mapData.boulders.filter(boulder => mapFetch.bounds.contains(boulder))
  }

  const getFilteredCliffs = () => {
    if (!options.showCliffs) {
      return []
    }
    return mapData.cliffs.map(linesToCoords).filter(cliff => mapFetch.bounds.contains(cliff))
  }

  const getFilteredCracks = () => {
    if (!options.showCracks) {
      return []
    }
    return mapData.cracks.map(linesToCoords).filter(crack => mapFetch.bounds.contains(crack))
  }

  return (
    <div className="map-view">
      <div className="map-controls">
        {TOGGLES.map(toggle => (
          <label key={`toggle-${toggle}`}><input type="checkbox" checked={options[toggle]} onChange={() => setOptions({ ...options, [toggle]: !options[toggle] })} /> {toggleLabels[toggle]}</label>
        ))}
      </div>
      <MapContainer center={[61.84197595742, 24.37207556552406]} zoom={7} scrollWheelZoom={true} id='map' >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapHook mapFetch={mapFetch} setMapFetch={setMapFetch} />
        <MarkerCluster key={'user-location'} markers={options.allowLocation && userLocation ? [userLocation] : []} icon="generic" />
        <MarkerCluster key={'boulder-cluster'} markers={getFilteredBoulders()} icon="boulder" />
        <MarkerCluster key={'cliff-cluster'} markers={getFilteredCliffs()} icon="cliff" />
        <MarkerCluster key={'crack-cluster'} markers={getFilteredCracks()} icon="crack" />
      </MapContainer>
    </div>
  )
}

const MapHook: React.FC<{ mapFetch: MapFetchInfo, setMapFetch: (mapFetch: MapFetchInfo) => void }> = ({ mapFetch, setMapFetch }) => {
  const map = useMap()

  const pollMap = () => {
    const zoom = map.getZoom()
    const bounds = map.getBounds()
    setMapFetch({ ...mapFetch, bounds, zoom })
  }

  // set interval to poll map bounds
  useEffect(() => {
    const interval = setInterval(() => {
      pollMap()
    }, 2500)

    return () => clearInterval(interval)
  }, [map])

  return null
}
