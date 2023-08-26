import { AvailableMapType, Bounds, Coord, Line } from "./shared"

export const TOGGLES = ['showBoulders', 'showCliffs', 'showCracks', 'allowLocation', 'focusLocation'] as const
export type SettingToggle = typeof TOGGLES[number]

export type UserSettings = Record<SettingToggle, boolean> & {
  mapToUse: AvailableMapType
}

export type MapSession = {
  bounds: Bounds
  zoom: number
  center: Coord
}

type Category = 'favorite' | 'visited' | 'hidden'

type WithNoteAndCategory<T> = {
  value: T
  note: string
  category: Category
}

export type UserData = {
  boulders: Record<string, WithNoteAndCategory<Coord>>
  cliffs: Record<string, WithNoteAndCategory<Coord>>
  cracks: Record<string, WithNoteAndCategory<Coord>>
}

const validateUserSettings = (settings: UserSettings): boolean => {
  TOGGLES.forEach((toggle) => {
    if (typeof settings[toggle] !== 'boolean') {
      return false
    }
  })
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


export const coordToKey = (coord: Coord) => `${coord[0]}-${coord[1]}`
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
