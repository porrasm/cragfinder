import { useEffect } from "react"
import L from "leaflet"
import "leaflet.markercluster/dist/leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import { useMap } from "react-leaflet"
import { Coord } from "./shared"
import React from "react"

type ClusterType = 'boulder' | 'cliff' | 'crack' | 'generic'

type MarkerClusterProps = {
  markers: Coord[]
  icon: ClusterType
}

const boulderCluster = new L.MarkerClusterGroup()
const cliffCluster = new L.MarkerClusterGroup()
const crackCluster = new L.MarkerClusterGroup()
const genericCluster = new L.MarkerClusterGroup()

const GENERIC_ICON = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon.png",
  iconSize: [25, 41]
});

const getCluster = (icon: ClusterType) => {
  switch (icon) {
    case 'boulder':
      return boulderCluster
    case 'cliff':
      return cliffCluster
    case 'crack':
      return crackCluster
    default:
      return genericCluster
  }
}

const MarkerCluster: React.FC<MarkerClusterProps> = ({ markers, icon }) => {
  const map = useMap()

  const firstCoord = markers[0]
  const [prevFirstCoord, setPrevFirstCoord] = React.useState<Coord | undefined>(undefined)

  const cluster = getCluster(icon)

  map.getBounds

  const customIcon = icon === 'generic' ? GENERIC_ICON : new L.Icon({
    iconUrl: `${icon}.png`,
    iconSize: [30, 30]
  })

  if (firstCoord !== prevFirstCoord) {
    setPrevFirstCoord(firstCoord)
    cluster.clearLayers()
    markers.forEach(position =>
      L.marker(new L.LatLng(position[0], position[1]), {
        icon: customIcon
      }).addTo(cluster)
    )

    map.addLayer(cluster)
  }

  return null
}

export default React.memo(MarkerCluster)
