import L, { Marker } from "leaflet"
import "leaflet.markercluster/dist/leaflet.markercluster"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import { useMap } from "react-leaflet"
import { Coord } from "./shared"
import React, { useEffect } from "react"

type ClusterType = 'boulder' | 'cliff' | 'crack' | 'generic'

type MarkerClusterProps = {
  markers: Coord[]
  icon: ClusterType
  onClick?: (coord: Coord) => void
}

export const CLOSE_ZOOM = 15

const options: L.MarkerClusterGroupOptions = {
  showCoverageOnHover: true,
  spiderfyOnMaxZoom: true,
  disableClusteringAtZoom: CLOSE_ZOOM,
  animate: true,
  removeOutsideVisibleBounds: true,
}

const GENERIC_ICON = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.5.1/dist/images/marker-icon.png",
  iconSize: [25, 41]
});

const MarkerCluster: React.FC<MarkerClusterProps> = ({ markers, icon, onClick }) => {
  const map = useMap()

  const firstCoord = markers[0]
  const [cluster, setCluster] = React.useState<L.MarkerClusterGroup>()
  const [prevFirstCoord, setPrevFirstCoord] = React.useState<Coord | undefined>(undefined)

  const onMarkerClick = (e: L.LeafletMouseEvent) => {
    const coord: Coord = [e.latlng.lat, e.latlng.lng]
    if (onClick) {
      onClick(coord)
    }
  }

  useEffect(() => {
    const removeCluster = () => {
      if (cluster) {
        cluster.remove()
      }
    }

    const newCluster = new L.MarkerClusterGroup(options)
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

  const customIcon = icon === 'generic' ? GENERIC_ICON : new L.Icon({
    iconUrl: `${icon}.png`,
    iconSize: [30, 30]
  })

  if (firstCoord !== prevFirstCoord) {
    setPrevFirstCoord(firstCoord)
    cluster.clearLayers()

    console.log({
      cluster,
      markers,
      map
    })

    markers.forEach(position => {
      console.log('adding marker ', {
        icon,
        position
      })
      try {

        L.marker(new L.LatLng(position[0], position[1]), {
          icon: customIcon
        }).addTo(cluster)
      } catch (e) {
        console.log('error adding marker', e)
      }
    })

    map.addLayer(cluster)

  }

  return null
}

export default MarkerCluster
