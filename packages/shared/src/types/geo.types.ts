export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}
