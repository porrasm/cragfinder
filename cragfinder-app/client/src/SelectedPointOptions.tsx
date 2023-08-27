import { Options } from "./Options"
import { Coord, MapDataType } from "./shared"
import { PointOptions, UserData, WithNoteAndCategory as CoordValueWithPointOptions, coordToKey } from "./userData"

export type SelectedPoint = {
  coord: Coord
  type: MapDataType
}

type Props = {
  selectedPoint: SelectedPoint
  userData: UserData
  updateUserData: (userData: UserData) => void
  close: () => void
}

const openCoordOnGoogleMapsUrl = (coord: Coord) => {
  const lat = coord[0]
  const lng = coord[1]
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  return url
}

const getPointOptions = (selectedPoint: SelectedPoint, userData: UserData): PointOptions => {
  let pointOptions: CoordValueWithPointOptions | undefined = undefined
  const key = coordToKey(selectedPoint.coord)

  switch (selectedPoint.type) {
    case 'boulder':
      pointOptions = userData.boulders[key]
      break
    case 'cliff':
      pointOptions = userData.cliffs[key]
      break
    case 'crack':
      pointOptions = userData.cracks[key]
      break
  }

  if (!pointOptions) {
    return {
      note: '',
      favorite: false,
      visited: false,
      hidden: false,
    }
  }

  const optionsAsAny: any = { ...pointOptions }
  delete optionsAsAny.value

  return optionsAsAny
}

export const SelectedPointOptions: React.FC<Props> = ({ selectedPoint, userData, updateUserData, close }) => {
  const pointOptions = getPointOptions(selectedPoint, userData)

  console.log('SelectedPointOptions', selectedPoint, pointOptions)

  if (!pointOptions) {
    return null
  }

  const onChange = (newOptions: PointOptions) => {
    const newUserData = { ...userData }
    const key = coordToKey(selectedPoint.coord)

    switch (selectedPoint.type) {
      case 'boulder':
        newUserData.boulders[key] = { ...newOptions, value: selectedPoint.coord }
        break
      case 'cliff':
        newUserData.cliffs[key] = { ...newOptions, value: selectedPoint.coord }
        break
      case 'crack':
        newUserData.cracks[key] = { ...newOptions, value: selectedPoint.coord }
        break
    }

    updateUserData(newUserData)
  }

  return <Options
    values={pointOptions}
    onChange={onChange}
    hideText={`Close ${selectedPoint.type}`}
    expandedDefault={true}
    alwaysMobile={true}
    onChangeExpanded={(e) => {
      if (!e) {
        close()
      }
    }}
    options={{
      note: {
        label: 'Note',
        options: 'anyString'
      },
      favorite: {
        label: 'Favorite',
      },
      visited: {
        label: 'Visited',
      },
      hidden: {
        label: 'Hidden',
      },
    }}
    startElements={[
      <span>Selected {selectedPoint.type} location: {coordToKey(selectedPoint.coord)}</span>,
      <a href={openCoordOnGoogleMapsUrl(selectedPoint.coord)}>Open in Google Maps</a>
    ]}
  />
}
