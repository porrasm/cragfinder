import React, { useEffect } from "react"
import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { AreaGrid, Bounds, Coord, Line, MapData, Point, findPartitionOfPoint, getBoundsGridCells } from "./shared"
import { getAreaGrid, getCracks, getMapData } from "./api"
import L from "leaflet";
import "leaflet.markercluster/dist/leaflet.markercluster";
import MarkerCluster from "./MarkerCluster";
import { MapSession, SettingToggle, TOGGLES, UserData, UserSettings, getUserDataManager } from "./userData";
import { pickRandomlyFromArray } from "./util";

const MINIMUM_ZOOM = 13
const MAX_AREAS = 15

const MAX_MARKERS = 250

const linesToCoords = (lines: Line): Coord => {
  // get center of all line positions
  const lat = lines.reduce((acc, cur) => acc + cur[0], 0) / lines.length
  const lng = lines.reduce((acc, cur) => acc + cur[1], 0) / lines.length

  return [lat, lng]
}

const toggleLabels: Record<SettingToggle, string> = {
  showBoulders: 'Boulders',
  showCliffs: 'Cliffs',
  showCracks: 'Cracks',
  allowLocation: 'Allow location'
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

const pointToKey = (point: Point) => `${point.x},${point.y}`
const keyToPoint = (key: string): Point => {
  const [x, y] = key.split(',').map(s => Number(s))
  return { x, y }
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

  const [fetchedIndexes, setFetchedIndexes] = React.useState<Record<string, boolean>>({})

  const getUserLocation = () => {
    if (!userSettings.allowLocation) {
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
    console.log({ userSession })
    const bounds = userSession.bounds

    const indexes = (userSession.zoom < MINIMUM_ZOOM ? [findPartitionOfPoint(areaGrid, userSession.center)] : getBoundsGridCells(areaGrid, bounds))
      .map(p => pointToKey({
        x: p[0],
        y: p[1]
      }))
      .filter(key => !fetchedIndexes[key])
      .map(keyToPoint)
      .filter(point => isValidindex(point, areaGrid))
      .filter((p, i) => i < MAX_AREAS)

    const fetchNewData = async () => {
      for (const point of indexes) {
        try {
          const data = await getMapData(point)

          if (Object.keys(fetchedIndexes).length >= MAX_AREAS) {
            setMapData(data)
            setFetchedIndexes({ [pointToKey(point)]: true })
            return
          }

          setMapData(prev => ({
            boulders: [...prev.boulders, ...data.boulders],
            cliffs: [...prev.cliffs, ...data.cliffs],
            cracks: [...prev.cracks, ...data.cracks]
          }))
          setFetchedIndexes(prev => ({ ...prev, [pointToKey(point)]: true }))
        } catch {

        }
      }
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

  return (
    <div className="map-view">
      <div className="map-controls">
        {TOGGLES.map(toggle => (
          <label key={`toggle-${toggle}`}><input type="checkbox" checked={userSettings[toggle]} onChange={() => updateSettings({ ...userSettings, [toggle]: !userSettings[toggle] })} /> {toggleLabels[toggle]}</label>
        ))}
      </div>
      <MapContainer center={userSession.center} zoom={userSession.zoom} scrollWheelZoom={true} id='map' >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapHook mapFetch={userSession} setMapFetch={updateSession} />
        <MarkerCluster key={'user-location'} markers={userSettings.allowLocation && userLocation ? [userLocation] : []} icon="generic" />
        <MarkerCluster key={'boulder-cluster'} markers={getFilteredBoulders()} icon="boulder" />
        <MarkerCluster key={'cliff-cluster'} markers={getFilteredCliffs()} icon="cliff" />
        <MarkerCluster key={'crack-cluster'} markers={getFilteredCracks()} icon="crack" />
      </MapContainer>
    </div>
  )
}

const MapHook: React.FC<{ mapFetch: MapSession, setMapFetch: (mapFetch: MapSession) => void }> = ({ mapFetch, setMapFetch }) => {
  const map = useMap()

  useEffect(() => {
    pollMap()
    map.on('moveend', pollMap)
    const remove = () => {
      map.off('moveend', pollMap)
    }
    return remove
  }, [map])

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

  return null
}

const boundsContainsPoint = (bounds: Bounds, point: Coord) => {
  return bounds.lat0 <= point[0] && bounds.lat1 >= point[0] && bounds.lng0 <= point[1] && bounds.lng1 >= point[1]
}

