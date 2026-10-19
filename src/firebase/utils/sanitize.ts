/**
 * Robust utility for sanitizing and validating payloads before sending to Firebase Firestore.
 * Prevents "Function setDoc() called with invalid data. Unsupported field value: undefined".
 * Ensures no non-serializable objects (File, Error, functions, Leaflet LatLng instances) reach Firestore.
 */

export function cleanFirestorePayload<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Primitives
  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined && typeof item !== 'function' && !(typeof item === 'number' && Number.isNaN(item)))
      .map((item) => (typeof item === 'object' && item !== null ? cleanFirestorePayload(item) : item)) as unknown as T;
  }

  // Strip instances of File, Blob, Error, or Window/DOM nodes
  if (typeof File !== 'undefined' && obj instanceof File) return undefined as any;
  if (typeof Blob !== 'undefined' && obj instanceof Blob) return undefined as any;
  if (typeof Error !== 'undefined' && obj instanceof Error) return undefined as any;

  // Convert Leaflet LatLng object to plain { lat, lng } if encountered
  if (
    typeof (obj as any).lat === 'number' &&
    typeof (obj as any).lng === 'number' &&
    typeof (obj as any).distanceTo === 'function'
  ) {
    return { lat: (obj as any).lat, lng: (obj as any).lng } as unknown as T;
  }

  // Handle plain objects
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    // 1. Exclude undefined, functions, and NaN completely
    if (value === undefined || typeof value === 'function' || (typeof value === 'number' && Number.isNaN(value))) {
      continue;
    }

    // 2. Leaflet LatLng instance inside property: convert to plain coordinates
    if (
      value !== null &&
      typeof value === 'object' &&
      typeof (value as any).lat === 'number' &&
      typeof (value as any).lng === 'number' &&
      typeof (value as any).distanceTo === 'function'
    ) {
      cleaned[key] = { lat: (value as any).lat, lng: (value as any).lng };
      continue;
    }

    // 3. Dates are supported by Firestore SDK
    if (value instanceof Date) {
      cleaned[key] = value.toISOString();
      continue;
    }

    // 3.5 Firestore FieldValue instances (e.g., deleteField, serverTimestamp, arrayUnion)
    if (
      value !== null &&
      typeof value === 'object' &&
      (
        '_methodName' in value ||
        (value as any).constructor?.name?.includes('FieldValue') ||
        (value as any).constructor?.name?.includes('ServerTimestamp') ||
        (value as any)._delegate !== undefined
      )
    ) {
      cleaned[key] = value;
      continue;
    }

    // 4. Nested objects and arrays
    if (value !== null && typeof value === 'object') {
      const cleanedChild = cleanFirestorePayload(value);
      if (cleanedChild !== undefined) {
        cleaned[key] = cleanedChild;
      }
    } else {
      cleaned[key] = value;
    }
  }

  return cleaned as T;
}

/**
 * Validates Risk Zone before saving to Firestore
 */
export function validateRiskZonePayload(data: {
  name: string;
  zoneType: string;
  geometryType: string;
  coordinates: string;
  radius?: number;
}): { isValid: boolean; error?: string } {
  if (!data.name || !data.name.trim()) {
    return { isValid: false, error: 'Nama zona risiko wajib diisi.' };
  }

  if (!['red', 'yellow', 'green'].includes(data.zoneType)) {
    return { isValid: false, error: 'Tingkat risiko zona harus merah, kuning, atau hijau.' };
  }

  if (!['polygon', 'circle', 'rectangle'].includes(data.geometryType)) {
    return { isValid: false, error: 'Tipe geometri zona tidak valid (harus polygon, circle, atau rectangle).' };
  }

  try {
    const parsed = JSON.parse(data.coordinates);

    if (data.geometryType === 'circle') {
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof parsed.lat !== 'number' ||
        isNaN(parsed.lat) ||
        typeof parsed.lng !== 'number' ||
        isNaN(parsed.lng)
      ) {
        return { isValid: false, error: 'Koordinat titik pusat lingkaran tidak valid.' };
      }
      if (!data.radius || typeof data.radius !== 'number' || data.radius <= 0) {
        return { isValid: false, error: 'Radius lingkaran harus lebih besar dari 0 meter.' };
      }
    } else if (data.geometryType === 'polygon') {
      if (!Array.isArray(parsed) || parsed.length < 3) {
        return { isValid: false, error: 'Polygon zona risiko membutuhkan minimal 3 titik koordinat.' };
      }
      for (let i = 0; i < parsed.length; i++) {
        if (
          typeof parsed[i]?.lat !== 'number' ||
          isNaN(parsed[i].lat) ||
          typeof parsed[i]?.lng !== 'number' ||
          isNaN(parsed[i].lng)
        ) {
          return { isValid: false, error: `Titik ke-${i + 1} polygon tidak memiliki koordinat valid.` };
        }
      }
    } else if (data.geometryType === 'rectangle') {
      if (!Array.isArray(parsed) || parsed.length < 2) {
        return { isValid: false, error: 'Persegi panjang membutuhkan minimal 2 titik sudut koordinat.' };
      }
      for (let i = 0; i < parsed.length; i++) {
        if (
          typeof parsed[i]?.lat !== 'number' ||
          isNaN(parsed[i].lat) ||
          typeof parsed[i]?.lng !== 'number' ||
          isNaN(parsed[i].lng)
        ) {
          return { isValid: false, error: `Sudut ke-${i + 1} persegi panjang tidak valid.` };
        }
      }
    }
  } catch {
    return { isValid: false, error: 'Format koordinat zona tidak valid (JSON Parse Error).' };
  }

  return { isValid: true };
}

/**
 * Validates Medical Unit before saving to Firestore
 */
export function validateMedicalUnitPayload(data: {
  name: string;
  unitCode: string;
  lat: number;
  lng: number;
}): { isValid: boolean; error?: string } {
  if (!data.name || !data.name.trim()) {
    return { isValid: false, error: 'Nama unit medis wajib diisi.' };
  }

  if (!data.unitCode || !data.unitCode.trim()) {
    return { isValid: false, error: 'Kode unit / callsign wajib diisi.' };
  }

  if (typeof data.lat !== 'number' || isNaN(data.lat) || typeof data.lng !== 'number' || isNaN(data.lng)) {
    return { isValid: false, error: 'Koordinat latitude dan longitude harus berupa angka desimal valid.' };
  }

  if (data.lat < -90 || data.lat > 90) {
    return { isValid: false, error: 'Latitude harus berada dalam rentang -90 hingga 90 derajat.' };
  }

  if (data.lng < -180 || data.lng > 180) {
    return { isValid: false, error: 'Longitude harus berada dalam rentang -180 hingga 180 derajat.' };
  }

  return { isValid: true };
}
