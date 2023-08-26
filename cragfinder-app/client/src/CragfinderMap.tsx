import React, { useEffect } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { AVAILABLE_MAPS, AreaGrid, AvailableMapType, Bounds, Coord, LeafletMapConfig, Line, MapData, Point, distance, findPartitionOfPoint, getBoundsGridCells } from "./shared"
import { getAreaGrid, getCracks, getMapData } from "./api"
import L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster";
import MarkerCluster, { CLOSE_ZOOM } from "./MarkerCluster";
import { MapSession, TOGGLES, UserData, UserSettings, getUserDataManager } from "./userData";
import { pickRandomlyFromArray } from "./util";
import { MAP_NAMES, MAP_URLS } from "./maps";
import { max } from "lodash";
import { MapOptions } from "./MapOptions";

const MINIMUM_ZOOM = 11
const MAX_MARKERS = 250

const linesToCoords = (lines: Line): Coord => {
  // get center of all line positions
  const lat = lines.reduce((acc, cur) => acc + cur[0], 0) / lines.length
  const lng = lines.reduce((acc, cur) => acc + cur[1], 0) / lines.length

  return [lat, lng]
}

const isValidindex = (point: Point, areaGrid: AreaGrid) => {
  return point.x >= 0 && point.x < areaGrid.length && point.y >= 0 && point.y < areaGrid[0].length
}

const latLngBoundsToBounds = (latLngBounds: L.LatLngBounds): Bounds => ({
  lat0: latLngBounds.getSouth(),
  lng0: latLngBounds.getWest(),
  lat1: latLngBounds.getNorth(),
  lng1: latLngBounds.getEast()
})

const openMapOnClick = (coord: Coord) => {
  if (!window.confirm(`Open Google Maps (${coord[0]}, ${coord[1]})?`)) {
    return
  }

  const lat = coord[0]
  const lng = coord[1]
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  window.open(url, '_blank')
}

export const CragFinderMapWrapper: React.FC = () => {
  const userDataManager = getUserDataManager()

  const [areaGrid, setAreaGrid] = React.useState<AreaGrid>()
  const [cracks, setCracks] = React.useState<Line[]>([])

  const [userSettings, setUserSettings] = React.useState<UserSettings>()
  const [userSession, setUserSession] = React.useState<MapSession>()
  const [userData, setUserData] = React.useState<UserData>()

  useEffect(() => {
    getAreaGrid().then(areaGrid => setAreaGrid(areaGrid))
    getCracks().then(cracks => setCracks(cracks))

    userDataManager.loadSettings().then(settings => setUserSettings(settings))
    userDataManager.loadSession().then(session => setUserSession(session))
    userDataManager.loadUserData().then(userData => setUserData(userData))
  }, [])

  const updateSettings = (settings: UserSettings) => {
    try {
      userDataManager.saveSettings(settings).then(() => setUserSettings(settings))
    } catch (e) {
      console.error(e)
    }
  }

  const updateSession = (session: MapSession) => {
    try {
      userDataManager.saveSession(session).then(() => setUserSession(session))
    } catch (e) {
      console.error(e)
    }
  }

  const updateUserData = (userData: UserData) => {
    try {
      userDataManager.saveUserData(userData).then(() => setUserData(userData))
    } catch (e) {
      console.error(e)
    }
  }

  if (!areaGrid || !cracks || !userSettings || !userSession || !userData) {
    return <div>Loading...</div>
  }

  return (
    <CragfinderMap
      areaGrid={areaGrid}
      cracks={cracks}
      userSettings={userSettings}
      userSession={userSession}
      userData={userData}
      updateSettings={updateSettings}
      updateSession={updateSession}
      updateUserData={updateUserData}
    />
  )
}

type CragFinderProps = {
  areaGrid: AreaGrid,
  cracks: Line[],
  userSettings: UserSettings,
  userSession: MapSession,
  userData: UserData,
  updateSettings: (settings: UserSettings) => void,
  updateSession: (session: MapSession) => void,
  updateUserData: (userData: UserData) => void
}

const CragfinderMap: React.FC<CragFinderProps> = ({
  areaGrid,
  cracks,
  userSettings,
  userSession,
  userData,
  updateSettings,
  updateSession,
  updateUserData
}) => {
  const [mapData, setMapData] = React.useState<MapData>({
    boulders: [],
    cliffs: [],
    cracks: []
  })
  const [userLocations, setUserLocations] = React.useState<Coord[]>([])

  const pushNewUserLocation = (location: Coord) => {
    const MAX_LOCATIONS = 5

    const newLocations = [...userLocations, location]
    const locations = newLocations.length > MAX_LOCATIONS ? newLocations.slice(newLocations.length - MAX_LOCATIONS) : newLocations

    setUserLocations(locations)
  }

  const getAverageUserLocation = (): Coord => {
    if (userLocations.length === 0) {
      return [0, 0]
    }

    const lat = userLocations.reduce((acc, cur) => acc + cur[0], 0) / userLocations.length
    const lng = userLocations.reduce((acc, cur) => acc + cur[1], 0) / userLocations.length

    return [lat, lng]
  }

  useEffect(() => {
    // set interval to update user location

    const pollLocation = () => {
      if (!userSettings.allowLocation) {
        return
      }

      if ("geolocation" in navigator === false) {
        return null
      }

      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const location: Coord = [lat, lng]
        pushNewUserLocation(location)
      }, (error) => {
        console.log(error)
        return null
      })
    }

    const interval = setInterval(() => {
      pollLocation()
    }, 1000)
    pollLocation()

    return () => clearInterval(interval)
  }, [userSettings.allowLocation, setUserLocations])


  useEffect(() => {
    const bounds = userSession.bounds

    type FetchOption = {
      index: Point,
      fetchFrom: 'cache' | 'cacheOrServer'
    }

    const getFetchOptions = (): FetchOption[] => {
      const fetchFrom: 'cache' | 'cacheOrServer' = userSession.zoom < MINIMUM_ZOOM ? 'cache' : 'cacheOrServer'
      const indexes = getBoundsGridCells(areaGrid, bounds).map(point => ({ index: { x: point[0], y: point[1] }, fetchFrom })).filter(point => isValidindex(point.index, areaGrid))

      if (userSession.zoom < MINIMUM_ZOOM) {
        const currentPoint = findPartitionOfPoint(areaGrid, userSession.center)
        const indexesWithoutCurrent = indexes.filter(point => point.index.x !== currentPoint[0] && point.index.y !== currentPoint[1])
        return [{
          index: {
            x: currentPoint[0],
            y: currentPoint[1]
          },
          fetchFrom: 'cacheOrServer'
        }, ...indexesWithoutCurrent]
      }

      return indexes
    }

    const indexes: FetchOption[] = getFetchOptions()

    const fetchNewData = async () => {
      if (!userSettings.showBoulders && !userSettings.showCliffs && !userSettings.showCracks) {
        return
      }

      const boulders: Coord[] = []
      const cliffs: Line[] = []
      const cracks: Line[] = []

      for (const fetchOption of indexes) {
        try {
          const data = await getMapData(fetchOption.index, fetchOption.fetchFrom)
          if (data) {
            boulders.push(...data.boulders)
            cliffs.push(...data.cliffs)
            cracks.push(...data.cracks)
          }
        } catch {

        }
      }

      setMapData({
        boulders,
        cliffs,
        cracks
      })
    }

    fetchNewData()

    if (indexes.length === 0) {
      return
    }

  }, [userSession.bounds])

  if (!areaGrid) {
    return <div>Loading...</div>
  }

  const getFilteredBoulders = () => {
    if (!userSettings.showBoulders) {
      return []
    }

    return pickRandomlyFromArray(mapData.boulders.filter(c => boundsContainsPoint(userSession.bounds, c)), MAX_MARKERS)
  }

  const getFilteredCliffs = () => {
    if (!userSettings.showCliffs) {
      return []
    }
    return pickRandomlyFromArray(mapData.cliffs.map(linesToCoords).filter(c => boundsContainsPoint(userSession.bounds, c)), MAX_MARKERS)
  }

  const getFilteredCracks = () => {
    if (!userSettings.showCracks) {
      return []
    }
    return pickRandomlyFromArray(cracks.map(linesToCoords).filter(c => boundsContainsPoint(userSession.bounds, c)), MAX_MARKERS)
  }

  const getFocusLocation = (): Coord | undefined => {
    if (!userSettings.focusLocation || !userSettings.allowLocation || userLocations.length === 0) {
      return undefined
    }

    return getAverageUserLocation()
  }

  return (
    <div className="map-view">
      <MapOptions userSettings={userSettings} updateSettings={updateSettings} />
      <MapContainer center={userSession.center} zoom={userSession.zoom} scrollWheelZoom={true} id='map' >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={MAP_URLS[userSettings.mapToUse]}
        />
        <MapHook mapFetch={userSession} setMapFetch={updateSession} focusLocation={getFocusLocation()} />
        <MarkerCluster key={'user-location'} markers={userSettings.allowLocation && userLocations.length ? [getAverageUserLocation()] : []} icon="generic" />
        <MarkerCluster key={'boulder-cluster'} markers={getFilteredBoulders()} icon="boulder" onClick={openMapOnClick} />
        <MarkerCluster key={'cliff-cluster'} markers={getFilteredCliffs()} icon="cliff" onClick={openMapOnClick} />
        <MarkerCluster key={'crack-cluster'} markers={getFilteredCracks()} icon="crack" onClick={openMapOnClick} />
      </MapContainer>
    </div>
  )
}

const MapHook: React.FC<{ mapFetch: MapSession, setMapFetch: (mapFetch: MapSession) => void, focusLocation?: Coord | undefined }> = ({ mapFetch, setMapFetch, focusLocation }) => {
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

const boundsContainsPoint = (bounds: Bounds, point: Coord) => {
  return bounds.lat0 <= point[0] && bounds.lat1 >= point[0] && bounds.lng0 <= point[1] && bounds.lng1 >= point[1]
}
