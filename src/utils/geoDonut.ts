import { LatLngPoint } from '../types';

/**
 * Generates Leaflet polygon coordinate rings for a true transparent donut (ring with hole).
 * Leaflet L.polygon([outerRing, innerRing]) renders an SVG path with fill-rule="evenodd",
 * leaving the central hole completely transparent and allowing direct map/marker clicks.
 *
 * @param center Center point (lat, lng) of the donut zone
 * @param outerRadius Outer radius in meters
 * @param innerRadius Inner radius in meters (must be < outerRadius). If undefined, defaults to ~55% of outerRadius.
 * @param segments Number of vertices for smooth circle rendering (default 64)
 * @returns Array containing [outerRingPoints, innerRingPoints] as [lat, lng] tuples
 */
export function createDonutPolygonRings(
  center: LatLngPoint,
  outerRadius: number,
  innerRadius?: number,
  segments: number = 64
): [[number, number][], [number, number][]] {
  const safeOuter = Math.max(15, outerRadius || 200);
  
  // If inner radius not specified or invalid, default to 55% of outer radius (leaving center hole)
  let safeInner: number;
  if (typeof innerRadius === 'number' && innerRadius > 0 && innerRadius < safeOuter) {
    safeInner = innerRadius;
  } else {
    safeInner = Math.max(10, Math.round(safeOuter * 0.55));
  }

  // Ensure inner radius is strictly smaller than outer radius with at least a 5m buffer
  if (safeInner >= safeOuter) {
    safeInner = Math.max(10, safeOuter - 10);
  }

  const latRadians = (center.lat * Math.PI) / 180;
  // Meters per degree latitude is approx 111,320m
  const metersPerDegreeLat = 111320;
  // Meters per degree longitude shrinks with cosine of latitude
  const metersPerDegreeLng = 111320 * Math.max(0.01, Math.cos(latRadians));

  const outerRing: [number, number][] = [];
  const innerRing: [number, number][] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const sinA = Math.sin(angle);
    const cosA = Math.cos(angle);

    // Outer ring (clockwise)
    const outLat = center.lat + (safeOuter * cosA) / metersPerDegreeLat;
    const outLng = center.lng + (safeOuter * sinA) / metersPerDegreeLng;
    outerRing.push([outLat, outLng]);

    // Inner ring (counter-clockwise or clockwise for even-odd fill-rule)
    const inLat = center.lat + (safeInner * cosA) / metersPerDegreeLat;
    const inLng = center.lng + (safeInner * sinA) / metersPerDegreeLng;
    innerRing.push([inLat, inLng]);
  }

  return [outerRing, innerRing];
}

/**
 * Calculates a sensible default inner radius given an outer radius
 */
export function getDefaultInnerRadius(outerRadius: number): number {
  const safeOuter = Math.max(20, outerRadius || 200);
  return Math.max(10, Math.round(safeOuter * 0.55));
}
