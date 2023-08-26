import { AvailableMapType, LeafletMapConfig } from "./shared"

export const MAP_URLS: LeafletMapConfig = {
  'openstreetmap': 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  'mml_terrain': '/api/maps/tile/{z}/{x}/{y}?map=mml_terrain',
  'mml_satellite': '/api/maps/tile/{z}/{x}/{y}?map=mml_satellite',
  'mml_background': '/api/maps/tile/{z}/{x}/{y}?map=mml_background',
  'mml_simple': '/api/maps/tile/{z}/{x}/{y}?map=mml_simple',
}

export const MAP_NAMES: Record<AvailableMapType, string> = {
  'openstreetmap': 'OpenStreetMap',
  'mml_terrain': 'Terrain (Maanmittauslaitos)',
  'mml_satellite': 'Satellite (Maanmittauslaitos)',
  'mml_background': 'Background (Maanmittauslaitos)',
  'mml_simple': 'Simple (Maanmittauslaitos)',
}
