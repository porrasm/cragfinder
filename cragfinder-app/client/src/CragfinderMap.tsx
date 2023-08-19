import React, { useEffect } from "react"
import { MapContainer, Popup, TileLayer, Marker } from "react-leaflet"
import { Coord, Line } from "./types"
import { getBoulders, getCliffs, getCracks } from "./api"
import L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster";
import MarkerCluster from "./MarkerCluster";

const linesToCoords = (lines: Line) => {
  // get center of all line positions
  const lat = lines.reduce((acc, cur) => acc + cur.lat, 0) / lines.length
  const lng = lines.reduce((acc, cur) => acc + cur.lng, 0) / lines.length

  return { lat, lng }
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

export const CragfinderMap = () => {
  const [boulders, setBoulders] = React.useState<Coord[]>([])
  const [cliffs, setCliffs] = React.useState<Line[]>([])
  const [cracks, setCracks] = React.useState<Line[]>([])
  const [userLocation, setUserLocation] = React.useState<Coord | null>(null)

  const [options, setOptions] = React.useState<Options>({
    showBoulders: true,
    showCliffs: true,
    showCracks: true,
    allowLocation: true
  })

  useEffect(() => {
    if (options.showBoulders && boulders.length === 0) {
      getBoulders().then(boulders => setBoulders(boulders))
    }
    if (options.showCliffs && cliffs.length === 0) {
      getCliffs().then(cliffs => setCliffs(cliffs))
    }
    if (options.showCracks && cracks.length === 0) {
      getCracks().then(cracks => setCracks(cracks))
    }

    if (options.allowLocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords
        console.log(latitude, longitude)
        setUserLocation({ lat: latitude, lng: longitude })
      })
    }
  }, [options])

  // poll location every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!options.allowLocation) {
        return
      }

      if ("geolocation" in navigator === false) {
        return
      }

      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords
        console.log(latitude, longitude)
        setUserLocation({ lat: latitude, lng: longitude })
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [options.allowLocation])


  console.log(boulders)

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
        <MarkerCluster key={'user-location'} markers={options.allowLocation && userLocation ? [userLocation] : []} icon="generic" />
        <MarkerCluster key={'boulder-cluster'} markers={options.showBoulders ? boulders : []} icon="boulder" />
        <MarkerCluster key={'cliff-cluster'} markers={options.showCliffs ? cliffs.map(linesToCoords) : []} icon="cliff" />
        <MarkerCluster key={'crack-cluster'} markers={options.showCracks ? cracks.map(linesToCoords) : []} icon="crack" />
      </MapContainer>
    </div>
  )
}
