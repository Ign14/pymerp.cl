/**
 * Utilidades para geohash y búsquedas geográficas
 * Usa geofire-common para calcular geohash desde coordenadas
 */

import { geohashForLocation } from 'geofire-common';

/**
 * Calcula el geohash desde coordenadas lat/lng usando geofire-common
 * @param latitude - Latitud
 * @param longitude - Longitud
 * @returns Geohash string
 */
export function calculateGeohash(latitude: number, longitude: number): string {
  try {
    // geofire-common espera [lat, lng]
    return geohashForLocation([latitude, longitude]);
  } catch (error) {
    // Fallback: implementación simple de geohash si hay error
    console.warn('[geohash] Error usando geofire-common, usando fallback:', error);
    return simpleGeohash(latitude, longitude);
  }
}

/**
 * Implementación simple de geohash como fallback
 * Nota: Esta es una versión simplificada. Para producción, usar geofire-common
 */
function simpleGeohash(latitude: number, longitude: number): string {
  // Base32 encoding para geohash
  const base32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let bits = 0;
  let even = true;
  let geohash = '';
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  // Generar geohash de 9 caracteres (precisión ~5m)
  while (geohash.length < 9) {
    if (even) {
      // Longitud
      const lonMid = (lonMin + lonMax) / 2;
      if (longitude >= lonMid) {
        bits = bits * 2 + 1;
        lonMin = lonMid;
      } else {
        bits = bits * 2;
        lonMax = lonMid;
      }
    } else {
      // Latitud
      const latMid = (latMin + latMax) / 2;
      if (latitude >= latMid) {
        bits = bits * 2 + 1;
        latMin = latMid;
      } else {
        bits = bits * 2;
        latMax = latMid;
      }
    }
    even = !even;

    if (bits >= 32) {
      geohash += base32[bits % 32];
      bits = 0;
    }
  }

  return geohash;
}

/**
 * Crea un objeto GeoPoint para Firestore
 * @param latitude - Latitud
 * @param longitude - Longitud
 * @returns Objeto con latitude y longitude (Firestore GeoPoint se serializa así)
 */
export function createGeoPoint(latitude: number, longitude: number): { latitude: number; longitude: number } {
  return {
    latitude,
    longitude,
  };
}

