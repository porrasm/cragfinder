import L from "leaflet"
import "leaflet.markercluster/dist/leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import { useMap } from "react-leaflet"
import { Coord, MapDataType } from "./shared"
import React, { useEffect } from "react"

type ClusterType = MapDataType | undefined

type MarkerClusterProps = {
  markers: Coord[]
  icon?: ClusterType
  isFavorite?: boolean
  onClick?: (coord: Coord, type: ClusterType) => void
  disableAtZoom?: number
}

export const CLOSE_ZOOM = 15

const options = (disableAtZoom: number): L.MarkerClusterGroupOptions => ({
  showCoverageOnHover: true,
  spiderfyOnMaxZoom: true,
  disableClusteringAtZoom: disableAtZoom,
  animate: true,
  removeOutsideVisibleBounds: true,
})

const GENERIC_ICON = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon.png",
  iconSize: [25, 41]
});

const MarkerCluster: React.FC<MarkerClusterProps> = ({ markers, icon, onClick, isFavorite, disableAtZoom }) => {
  const map = useMap()

  const firstCoord = markers[0]
  const [cluster, setCluster] = React.useState<L.MarkerClusterGroup>()
  const [prevFirstCoord, setPrevFirstCoord] = React.useState<Coord | undefined>(undefined)

  const onMarkerClick = (e: L.LeafletMouseEvent) => {
    const coord: Coord = [e.latlng.lat, e.latlng.lng]
    if (onClick) {
      onClick(coord, icon)
    }
  }

  useEffect(() => {
    const removeCluster = () => {
      if (cluster) {
        cluster.remove()
      }
    }

    const newCluster = new L.MarkerClusterGroup(options(disableAtZoom ?? CLOSE_ZOOM))
    setCluster(newCluster)

    return removeCluster
  }, [])

  useEffect(() => {
    if (!cluster || !map) {
      return
    }

    cluster.on('click', onMarkerClick)
    return () => {
      cluster.off('click', onMarkerClick)
    }
  }, [cluster])

  if (!cluster) {
    return null
  }

  const customIcon = !icon ? GENERIC_ICON : new L.Icon({
    iconUrl: `${icon}${isFavorite ? '-favorite' : ''}.png`,
    iconSize: [30, 30]
  })

  if (firstCoord !== prevFirstCoord) {
    setPrevFirstCoord(firstCoord)
    cluster.clearLayers()

    markers.forEach(position => {
      L.marker(new L.LatLng(position[0], position[1]), {
        icon: customIcon
      }).addTo(cluster)
    })

    map.addLayer(cluster)
  }

  return null
}

export default MarkerCluster
