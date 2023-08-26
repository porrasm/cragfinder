import React from "react";
import { MAP_NAMES } from "./maps";
import { AvailableMapType, AVAILABLE_MAPS } from "./shared";
import { SettingToggle, TOGGLES, UserSettings } from "./userData";
import classNames from "classnames";

type MapOptionsProps = {
  userSettings: UserSettings
  updateSettings: (settings: UserSettings) => void
}

const toggleLabels: Record<SettingToggle, string> = {
  showBoulders: 'Boulders',
  showCliffs: 'Cliffs',
  showCracks: 'Cracks',
  allowLocation: 'Allow location',
  focusLocation: 'Focus location'
}

export const MapOptions: React.FC<MapOptionsProps> = ({ userSettings, updateSettings }) => {
  const [expanded, setExpanded] = React.useState(false)

  const optionsContent = () => <React.Fragment key='map-options-content'>
    {
      TOGGLES.map(toggle => (
        <label key={`toggle-${toggle}`}><input type="checkbox" checked={userSettings[toggle]} onChange={() => updateSettings({ ...userSettings, [toggle]: !userSettings[toggle] })} /> {toggleLabels[toggle]}</label>
      ))
    }
    <select value={userSettings.mapToUse} onChange={(e) => {
      if (!e.target.value) {
        return
      }
      updateSettings({ ...userSettings, mapToUse: e.target.value as AvailableMapType })
    }}>
      {AVAILABLE_MAPS.map(map => (
        <option key={`map-${map}`} value={map}>{MAP_NAMES[map]}</option>
      ))}
    </select>
  </React.Fragment>

  const desktopOptions = () => <div className={classNames('map-controls', 'hide-on-mobile')}>
    {optionsContent()}
  </div>

  const mobileOptions = () => <div className={classNames(expanded ? 'map-controls-expanded' : 'map-controls', 'hide-on-desktop')}>
    <span className='mobile-options-header' onClick={() => setExpanded(prev => !prev)}>{expanded ? 'Hide options' : 'Show options'}</span>
    {expanded && optionsContent()}
  </div>


  return <React.Fragment key='map-options'>
    {mobileOptions()}
    {desktopOptions()}
  </React.Fragment>
}
