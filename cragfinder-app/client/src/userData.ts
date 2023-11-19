import { AvailableMapType, Bounds, Coord, Line } from "./shared"

export const TOGGLES = ['showBoulders', 'showCliffs', 'showCracks', 'allowLocation', 'focusLocation', 'showOnlyFavorites', 'showHidden', 'showVisited'] as const
export type SettingToggle = typeof TOGGLES[number]

export type UserSettings = Record<SettingToggle, boolean> & {
  mapToUse: AvailableMapType
  minimumCliffLength: string
}

export type MapSession = {
  bounds: Bounds
  zoom: number
  center: Coord
}

export type PointOptions = {
  note: string
  favorite: boolean
  visited: boolean
  hidden: boolean
}

export type WithNoteAndCategory = PointOptions & {
  value: Coord
}
export type UserPointsData = Record<string, WithNoteAndCategory>

export type UserData = {
  boulders: UserPointsData
  cliffs: UserPointsData
  cracks: UserPointsData
}

const validateUserSettings = (settings: UserSettings): boolean => {
  TOGGLES.forEach((toggle) => {
    if (typeof settings[toggle] !== 'boolean') {
      return false
    }
  })
  if (typeof settings.mapToUse !== 'string') {
    return false
  }

  // New settings added after initial release
  if (typeof settings.mapToUse !== 'string' || !settings.minimumCliffLength.length) {
    settings.minimumCliffLength = ""
  }
  return true
}

const validateUserData = (userData: UserData): boolean => {
  if (typeof userData.boulders !== 'object' || userData.boulders === null) {
    return false
  }
  if (typeof userData.cliffs !== 'object' || userData.cliffs === null) {
    return false
  }
  if (typeof userData.cracks !== 'object' || userData.cracks === null) {
    return false
  }
  return true
}

const validateMapSession = (session: MapSession): boolean => {
  if (typeof session.bounds !== 'object' || session.bounds === null) {
    return false
  }
  if (typeof session.zoom !== 'number') {
    return false
  }
  if (typeof session.center !== 'object' || session.center === null) {
    return false
  }

  return true
}


export const coordToKey = (coord: Coord) => `${coord[0]},${coord[1]}`
export const lineStringToKey = (lineString: Line) => coordToKey(lineString[0])

export type UserConfig = {
  settings: UserSettings,
  session: MapSession,
  data: UserData,
}

export type UserDataManager = {
  loadSettings: () => Promise<UserSettings>,
  saveSettings: (settings: UserSettings) => Promise<void>,
  loadSession: () => Promise<MapSession>,
  saveSession: (session: MapSession) => Promise<void>,
  loadUserData: () => Promise<UserData>,
  saveUserData: (userData: UserData) => Promise<void>,
}

export const DEFAULT_SETTINGS = (): UserSettings => ({
  showBoulders: true,
  showCliffs: false,
  showCracks: false,
  allowLocation: false,
  focusLocation: false,
  mapToUse: 'openstreetmap',
  showOnlyFavorites: false,
  showHidden: false,
  showVisited: true,
  minimumCliffLength: "",
})

export const DEFAULT_SESSION = (): MapSession => ({
  bounds: {
    lat0: 0,
    lat1: 0,
    lng0: 0,
    lng1: 0,
  },
  zoom: 7,
  center: [61.84197595742, 24.37207556552406],
})

export const DEFAULT_USER_DATA = (): UserData => ({
  boulders: {},
  cliffs: {},
  cracks: {},
})

const LOCAL_STORAGE_MANAGER = (): UserDataManager => ({
  loadSettings: async () => {
    try {
      const settings = localStorage.getItem('settings')
      const settingsObj = settings ? JSON.parse(settings) : DEFAULT_SETTINGS()
      return validateUserSettings(settingsObj) ? settingsObj : DEFAULT_SETTINGS()
    } catch (e) {
      return DEFAULT_SETTINGS()
    }
  },
  saveSettings: async (settings) => {
    localStorage.setItem('settings', JSON.stringify(settings))
  },
  loadSession: async () => {
    try {
      const session = localStorage.getItem('session')
      const sessionObj = session ? JSON.parse(session) : DEFAULT_SESSION()
      return validateMapSession(sessionObj) ? sessionObj : DEFAULT_SESSION()
    } catch (e) {
      return DEFAULT_SESSION()
    }
  },
  saveSession: async (session) => {
    localStorage.setItem('session', JSON.stringify(session))
  },
  loadUserData: async () => {
    try {
      const userData = localStorage.getItem('userData')
      const userDataObj = userData ? JSON.parse(userData) : DEFAULT_USER_DATA()
      return validateUserData(userDataObj) ? userDataObj : DEFAULT_USER_DATA()
    } catch (e) {
      return DEFAULT_USER_DATA()
    }
  },
  saveUserData: async (userData) => {
    localStorage.setItem('userData', JSON.stringify(userData))
  },
})

const DUMMY_DATA_MANAGER = (): UserDataManager => ({
  loadSettings: async () => DEFAULT_SETTINGS(),
  saveSettings: async () => { },
  loadSession: async () => DEFAULT_SESSION(),
  saveSession: async () => { },
  loadUserData: async () => DEFAULT_USER_DATA(),
  saveUserData: async () => { },
})

export const getUserDataManager = (): UserDataManager => LOCAL_STORAGE_MANAGER()
