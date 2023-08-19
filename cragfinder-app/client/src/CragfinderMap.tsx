import React, { useEffect } from "react"
import { MapContainer, Popup, TileLayer, Marker, useMap } from "react-leaflet"
import { Bounds, Coord, Line } from "./types"
import { getBoulders, getCliffs, getCracks } from "./api"
import L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster";
import MarkerCluster from "./MarkerCluster";

const MINIMUM_ZOOM = 13

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
  fetchedBounds: L.LatLngBounds[]
}

const latLngBoundsToBounds = (latLngBounds: L.LatLngBounds): Bounds => ({
  lat0: latLngBounds.getSouth(),
  lng0: latLngBounds.getWest(),
  lat1: latLngBounds.getNorth(),
  lng1: latLngBounds.getEast()
})

export const CragfinderMap = () => {
  const [boulders, setBoulders] = React.useState<Coord[]>([])
  const [cliffs, setCliffs] = React.useState<Line[]>([])
  const [cracks, setCracks] = React.useState<Line[]>([])

  const [mapFetch, setMapFetch] = React.useState<MapFetchInfo>(({
    bounds: new L.LatLngBounds([0, 0], [0, 0]),
    zoom: 0,
    fetchedBounds: []
  }))

  const [options, setOptions] = React.useState<Options>({
    showBoulders: true,
    showCliffs: false,
    showCracks: false,
    allowLocation: false
  })

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
    const bounds = latLngBoundsToBounds(mapFetch.bounds)

    console.log('Fetching boulders: ', bounds)

    if (options.showBoulders) {
      getBoulders(bounds).then(boulders => setBoulders(boulders))
    }
    if (options.showCliffs) {
      getCliffs(bounds).then(cliffs => setCliffs(cliffs))
    }
    if (options.showCracks) {
      getCracks(bounds).then(cracks => setCracks(cracks))
    }
  }, [mapFetch.bounds])

  console.log(mapFetch)

  const getFilteredBoulders = () => {
    if (!options.showBoulders) {
      return []
    }
    return boulders.filter(boulder => mapFetch.bounds.contains(boulder))
  }

  const getFilteredCliffs = () => {
    if (!options.showCliffs) {
      return []
    }
    return cliffs.map(linesToCoords).filter(cliff => mapFetch.bounds.contains(cliff))
  }

  const getFilteredCracks = () => {
    if (!options.showCracks) {
      return []
    }
    return cracks.map(linesToCoords).filter(crack => mapFetch.bounds.contains(crack))
  }


  return (
    <div className="map-view">
      <div className="map-controls">
        {TOGGLES.map(toggle => (
          <label key={`toggle-${toggle}`}><input type="checkbox" checked={options[toggle]} onChange={() => setOptions({ ...options, [toggle]: !options[toggle] })} /> {toggleLabels[toggle]}</label>
        ))}
      </div>
      <MapContainer center={[59.84197595742, 22.97207556552406]} zoom={13} scrollWheelZoom={true} id='map' >
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
    if (zoom < MINIMUM_ZOOM) {
      setMapFetch({ ...mapFetch, zoom })
      return
    }

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
