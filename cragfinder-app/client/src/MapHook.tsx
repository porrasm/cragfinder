import { max } from "lodash"
import React, { useEffect } from "react"
import { useMap } from "react-leaflet"
import { CLOSE_ZOOM } from "./MarkerCluster"
import { Bounds, Coord, distance } from "./shared"
import { MapSession } from "./userData"

const latLngBoundsToBounds = (latLngBounds: L.LatLngBounds): Bounds => ({
  lat0: latLngBounds.getSouth(),
  lng0: latLngBounds.getWest(),
  lat1: latLngBounds.getNorth(),
  lng1: latLngBounds.getEast()
})

export const MapHook: React.FC<{ mapFetch: MapSession, setMapFetch: (mapFetch: MapSession) => void, focusLocation?: Coord | undefined, focusedLocation?: () => void }> = ({ mapFetch, setMapFetch, focusLocation, focusedLocation }) => {
  const map = useMap()

  const [lastFlyTime, setLastFlyTime] = React.useState<number>(0)


  const onMoveEnd = () => {
    pollMap()
  }

  const pollMap = () => {
    if (!map) {
      return
    }

    const zoom = map.getZoom()
    const bounds = latLngBoundsToBounds(map.getBounds())
    const centerLatLng = map.getCenter()
    const center: Coord = [centerLatLng.lat, centerLatLng.lng]
    const state = { ...mapFetch, bounds, zoom, center }

    setMapFetch(state)
  }

  const flyToFocusLocation = () => {
    if (!map || !focusLocation) {
      return
    }

    const location = map.getCenter()
    const locationCoord: Coord = [location.lat, location.lng]

    if (Date.now() - lastFlyTime > 1000 && distance(locationCoord, focusLocation) > 5) {
      const zoom = max([CLOSE_ZOOM, map.getZoom()])

      map.flyTo(focusLocation, zoom)
      setLastFlyTime(Date.now())

      if (focusedLocation) {
        focusedLocation()
      }
    }
  }

  useEffect(() => {
    map.on('moveend', onMoveEnd)
    const remove = () => {
      map.off('moveend', onMoveEnd)
    }
    onMoveEnd()
    return remove
  }, [map])

  if (!map) {
    return null
  }

  flyToFocusLocation()

  return null
}