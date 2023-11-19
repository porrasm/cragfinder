import React from "react";
import { MAP_NAMES } from "./maps";
import { AVAILABLE_MAPS } from "./shared";
import { UserSettings } from "./userData";
import { Options } from "./Options";

type MapOptionsProps = {
  userSettings: UserSettings
  updateSettings: (settings: UserSettings) => void
}

export const MapOptions: React.FC<MapOptionsProps> = ({ userSettings, updateSettings }) => {

  return <Options
    values={userSettings}
    showText="Show options"
    hideText="Hide options"
    onChange={updateSettings} options={{
      showBoulders: {
        label: 'Boulders'
      },
      showCliffs: {
        label: 'Cliffs'
      },
      showCracks: {
        label: 'Cracks'
      },
      allowLocation: {
        label: 'Allow location'
      },
      focusLocation: {
        label: 'Focus location',
      },
      mapToUse: {
        label: 'Map',
        options: AVAILABLE_MAPS.map(map => ({ label: MAP_NAMES[map], value: map }))
      },
      showOnlyFavorites: {
        label: 'Only favorites'
      },
      showVisited: {
        label: 'Visited'
      },
      showHidden: {
        label: 'Hidden'
      },
      minimumCliffLength: {
        label: 'Minimum cliff length',
        options: 'anyString'
      },
    }} />
}
