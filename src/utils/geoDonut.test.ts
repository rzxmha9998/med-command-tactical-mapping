import { createDonutPolygonRings, getDefaultInnerRadius } from './geoDonut';
import { validateRiskZonePayload } from '../firebase/utils/sanitize';

console.log('--- RUNNING DONUT RISK ZONE TESTS ---');

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${msg}`);
  }
}

// 1. Basic Donut generation
const center = { lat: -6.175392, lng: 106.827153 };
const [outerRing, innerRing] = createDonutPolygonRings(center, 400, 200, 32);

assert(outerRing.length === 32, 'Outer ring has requested 32 vertices');
assert(innerRing.length === 32, 'Inner ring (hole) has requested 32 vertices');

// Check that inner ring coordinates are closer to center than outer ring
const outerDeltaLat = Math.abs(outerRing[0][0] - center.lat);
const innerDeltaLat = Math.abs(innerRing[0][0] - center.lat);
assert(innerDeltaLat < outerDeltaLat, 'Inner ring hole is strictly inside outer ring');

// 2. Default inner radius when unspecified (legacy zones from Firestore)
const [legacyOuter, legacyInner] = createDonutPolygonRings(center, 500, undefined, 16);
const legacyInnerDelta = Math.abs(legacyInner[0][0] - center.lat);
const legacyOuterDelta = Math.abs(legacyOuter[0][0] - center.lat);
assert(legacyInnerDelta < legacyOuterDelta, 'Legacy circle zone without innerRadius defaults to donut with transparent hole');
assert(getDefaultInnerRadius(500) === 275, 'Default inner radius is ~55% of outer radius');

// 3. Fallback when innerRadius >= outerRadius
const [clampedOuter, clampedInner] = createDonutPolygonRings(center, 100, 150, 16);
assert(clampedInner.length === 16, 'Clamped inner ring generated safely');
const clampedInnerDelta = Math.abs(clampedInner[0][0] - center.lat);
const clampedOuterDelta = Math.abs(clampedOuter[0][0] - center.lat);
assert(clampedInnerDelta < clampedOuterDelta, 'Inner radius cannot exceed or equal outer radius');

// 4. Validation of risk zone payload with innerRadius
const validDonut = validateRiskZonePayload({
  name: 'Zona Donat Uji',
  zoneType: 'red',
  geometryType: 'circle',
  coordinates: JSON.stringify(center),
  radius: 300,
  innerRadius: 150,
});
assert(validDonut.isValid === true, 'Valid donut payload passes validation');

const invalidInnerRadius = validateRiskZonePayload({
  name: 'Zona Donat Salah',
  zoneType: 'red',
  geometryType: 'circle',
  coordinates: JSON.stringify(center),
  radius: 300,
  innerRadius: 350, // invalid: inner >= outer
});
assert(invalidInnerRadius.isValid === false, 'Inner radius >= outer radius is rejected by validation');

const invalidNegativeInner = validateRiskZonePayload({
  name: 'Zona Donat Negatif',
  zoneType: 'red',
  geometryType: 'circle',
  coordinates: JSON.stringify(center),
  radius: 300,
  innerRadius: -10,
});
assert(invalidNegativeInner.isValid === false, 'Negative inner radius is rejected by validation');

console.log(`Donut Risk Zone Tests Completed: ${passed} passed, ${failed} failed.\n`);

if (failed > 0) {
  process.exit(1);
}
