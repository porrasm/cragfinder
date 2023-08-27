import React, { useEffect } from "react"
import { CragfinderMap } from "./CragfinderMap"
import { getAreaGrid, getCracks } from "./api"
import { AreaGrid, Line } from "./shared"
import { getUserDataManager, UserSettings, MapSession, UserData } from "./userData"

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