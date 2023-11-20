import React, { useEffect } from "react"
import { MapContainer, TileLayer } from "react-leaflet"
import { AreaGrid, Coord, Line, MapData, MapDataType, Point, boundsContainsPoint, findPartitionOfPoint, getBoundsGridCells, lineLength } from "./shared"
import { getMapData } from "./api"
import "leaflet.markercluster/dist/leaflet.markercluster";
import MarkerCluster from "./MarkerCluster";
import { MapSession, UserData, UserPointsData, UserSettings, coordToKey } from "./userData";
import { pickRandomlyFromArray } from "./util";
import { MAP_URLS } from "./maps";
import { MapOptions } from "./MapOptions";
import { MapHook } from "./MapHook";
import { SelectedPoint, SelectedPointOptions } from "./SelectedPointOptions";

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

export const CragfinderMap: React.FC<CragFinderProps> = ({
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
  const [selectedPoint, setSelectedPoint] = React.useState<SelectedPoint>()

  const onSelectMapDataPoint = (coord: Coord, type?: MapDataType) => {
    if (!type) {
      return
    }

    setSelectedPoint({
      coord,
      type
    })
  }


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

  const getFocusLocation = (): Coord | undefined => {
    if (!userSettings.focusLocation || !userSettings.allowLocation || userLocations.length === 0) {
      return undefined
    }

    return getAverageUserLocation()
  }

  function getFilteredPoints<T>(show: boolean, points: T[], pointsData: UserPointsData, toCoord: (t: T) => Coord, additionalFilter?: (t: T) => boolean): Coord[] {
    points = additionalFilter ? points.filter(additionalFilter) : points
    if (!show || userSettings.showOnlyFavorites) {
      return []
    }

    return pickRandomlyFromArray(
      points.map(toCoord)
        .filter(c => {
          const key = coordToKey(c)
          const data = pointsData[key]
          const hide =
            (!userSettings.showHidden && data?.hidden)
            || (!userSettings.showVisited && data?.visited)
            || data?.favorite
          return !hide
        })
        .filter(c => boundsContainsPoint(userSession.bounds, c)), MAX_MARKERS
    )
  }

  function getFavoritePoints(pointsData: UserPointsData): Coord[] {
    return Object.values(pointsData)
      .filter(value => value.favorite)
      .map(value => value.value)
  }

  const lineDistanceFilter = () => {
    if (!userSettings.minimumCliffLength) {
      return undefined
    }

    try {
      const minLengthValue = parseFloat(userSettings.minimumCliffLength)
      if (isNaN(minLengthValue) || minLengthValue <= 1) {
        return undefined
      }

      return (line: Line) => lineLength(line) >= minLengthValue
    } catch {
      return undefined
    }
  }

  return (
    <div className="map-view">
      <MapOptions userSettings={userSettings} updateSettings={updateSettings} />
      {!!selectedPoint && <SelectedPointOptions selectedPoint={selectedPoint} userData={userData} updateUserData={updateUserData} close={() => setSelectedPoint(undefined)} />}
      <MapContainer center={userSession.center} zoom={userSession.zoom} scrollWheelZoom={true} id='map' >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={MAP_URLS[userSettings.mapToUse]}
        />
        <MapHook mapFetch={userSession} setMapFetch={updateSession} focusLocation={getFocusLocation()} />
        <MarkerCluster key={'user-location'} markers={userSettings.allowLocation && userLocations.length ? [getAverageUserLocation()] : []} />

        <MarkerCluster key={'favorite-boulder-cluster'} markers={getFavoritePoints(userData.boulders)} icon="boulder" onClick={onSelectMapDataPoint} isFavorite={true} />
        <MarkerCluster key={'favorite-cliff-cluster'} markers={getFavoritePoints(userData.cliffs)} icon="cliff" onClick={onSelectMapDataPoint} isFavorite={true} />
        <MarkerCluster key={'favorite-crack-cluster'} markers={getFavoritePoints(userData.cracks)} icon="crack" onClick={onSelectMapDataPoint} isFavorite={true} />

        <MarkerCluster key={'boulder-cluster'} markers={getFilteredPoints(userSettings.showBoulders, mapData.boulders, userData.boulders, c => c)} icon="boulder" onClick={onSelectMapDataPoint} />
        <MarkerCluster key={'cliff-cluster'} markers={getFilteredPoints(userSettings.showCliffs, mapData.cliffs, userData.cliffs, linesToCoords, lineDistanceFilter())} icon="cliff" onClick={onSelectMapDataPoint} />
        <MarkerCluster key={'crack-cluster'} markers={getFilteredPoints(userSettings.showCracks, cracks, userData.cracks, linesToCoords)} icon="crack" onClick={onSelectMapDataPoint} />

      </MapContainer>
    </div>
  )
}
