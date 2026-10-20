import {
  calculateStraightLineDistance,
  formatTacticalDistance,
  isValidLatLng,
  createNavigationUrl,
  getZoneCenterCoordinates,
} from './referralHospitalService';
import { RiskZone } from '../../types';

function runHospitalTests() {
  console.log('\n--- RUNNING REFERRAL HOSPITAL TESTS ---');

  // 1. Distance Calculation (Monas to RSCM is ~2.8km straight line)
  const monasLat = -6.175392;
  const monasLng = 106.827153;
  const rscmLat = -6.196924;
  const rscmLng = 106.848529;

  const distMeters = calculateStraightLineDistance(monasLat, monasLng, rscmLat, rscmLng);
  if (distMeters >= 3000 && distMeters <= 3600) {
    console.log(`✅ PASS: Haversine distance Monas - RSCM accurate (${distMeters} m)`);
  } else {
    throw new Error(`FAIL: Unexpected distance: ${distMeters} m`);
  }

  // 2. Tactical Distance Formatting
  if (formatTacticalDistance(450) === '450 m') {
    console.log('✅ PASS: Distance < 1000m formatted in meters');
  } else {
    throw new Error('FAIL: formatTacticalDistance < 1000m');
  }

  if (formatTacticalDistance(2840) === '2.8 km') {
    console.log('✅ PASS: Distance >= 1000m formatted in km');
  } else {
    throw new Error('FAIL: formatTacticalDistance >= 1000m');
  }

  // 3. Coordinate Validation
  if (isValidLatLng(-6.175, 106.827) && !isValidLatLng(95, 100) && !isValidLatLng(NaN, 50)) {
    console.log('✅ PASS: isValidLatLng correctly validates boundaries and rejects NaN/out of range');
  } else {
    throw new Error('FAIL: isValidLatLng validation');
  }

  // 4. Navigation URL creation
  const navUrl = createNavigationUrl(-6.175392, 106.827153);
  if (navUrl.includes('google.com/maps/dir') && navUrl.includes('-6.175392,106.827153')) {
    console.log('✅ PASS: Google Maps navigation URL formatted correctly');
  } else {
    throw new Error(`FAIL: Navigation URL wrong: ${navUrl}`);
  }

  // 5. Zone Center Parsing
  const circleZone: RiskZone = {
    id: 'z-1',
    mapId: 'map-1',
    name: 'Zona Merah Monas',
    zoneType: 'red',
    geometryType: 'circle',
    coordinates: JSON.stringify({ lat: -6.175, lng: 106.827 }),
    radius: 300,
    riskLevel: 'Tinggi',
    createdAt: new Date().toISOString(),
  };

  const centerCircle = getZoneCenterCoordinates(circleZone);
  if (centerCircle.lat === -6.175 && centerCircle.lng === 106.827) {
    console.log('✅ PASS: Circle zone center parsed properly');
  } else {
    throw new Error('FAIL: Circle zone center coordinates');
  }

  const polyZone: RiskZone = {
    id: 'z-2',
    mapId: 'map-1',
    name: 'Zona Kuning Segitiga',
    zoneType: 'yellow',
    geometryType: 'polygon',
    coordinates: JSON.stringify([
      { lat: -6.10, lng: 106.80 },
      { lat: -6.20, lng: 106.80 },
      { lat: -6.15, lng: 106.90 },
    ]),
    riskLevel: 'Sedang',
    createdAt: new Date().toISOString(),
  };

  const centerPoly = getZoneCenterCoordinates(polyZone);
  if (Math.abs(centerPoly.lat - (-6.15)) < 0.001) {
    console.log('✅ PASS: Polygon centroid parsed accurately');
  } else {
    throw new Error('FAIL: Polygon centroid calculation');
  }

  console.log('TEST SUMMARY: All Referral Hospital Tests Passed.\n');
}

runHospitalTests();
