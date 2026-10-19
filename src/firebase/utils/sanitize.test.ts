/**
 * Unit tests reproducing the Firestore "Unsupported field value: undefined" error
 * and validating the sanitization and payload validation functions.
 */

import { cleanFirestorePayload, validateRiskZonePayload, validateMedicalUnitPayload } from './sanitize';

function runTests() {
  console.log('--- RUNNING FIRESTORE SANITIZE & VALIDATION TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. REPRODUCE: Payload containing undefined causes issues in standard Firestore setDoc
  {
    const problematicZonePayload = {
      name: 'Zona Merah Evakuasi',
      zoneType: 'red',
      geometryType: 'polygon',
      coordinates: JSON.stringify([
        { lat: -6.2, lng: 106.81 },
        { lat: -6.21, lng: 106.82 },
        { lat: -6.22, lng: 106.8 }
      ]),
      radius: undefined, // polygon does not have radius!
      description: undefined, // optional field empty
      notes: undefined, // optional field empty
    };

    // Demonstrating the error condition: Object.keys includes undefined values
    assert('radius' in problematicZonePayload && problematicZonePayload.radius === undefined,
      'Reproduce: Raw payload contains undefined key "radius"');
    assert('description' in problematicZonePayload && problematicZonePayload.description === undefined,
      'Reproduce: Raw payload contains undefined key "description"');

    // Cleaned payload must strip undefined fields
    const cleaned = cleanFirestorePayload(problematicZonePayload);
    assert(!('radius' in cleaned), 'Sanitize: "radius" key removed from polygon payload');
    assert(!('description' in cleaned), 'Sanitize: "description" key removed when undefined');
    assert(!('notes' in cleaned), 'Sanitize: "notes" key removed when undefined');
    assert(cleaned.name === 'Zona Merah Evakuasi', 'Sanitize: Valid field "name" preserved');
    assert(cleaned.zoneType === 'red', 'Sanitize: Valid field "zoneType" preserved');
  }

  // 2. Circle Geometry Validation
  {
    // Invalid circle (no radius)
    const invalidCircle = {
      name: 'Ring Isolasi',
      zoneType: 'red',
      geometryType: 'circle',
      coordinates: JSON.stringify({ lat: -6.2, lng: 106.8 }),
      radius: undefined,
    };
    const circleValidation = validateRiskZonePayload(invalidCircle as any);
    assert(!circleValidation.isValid, 'Validation: Circle without radius is rejected');

    // Valid circle
    const validCircle = {
      name: 'Ring Isolasi',
      zoneType: 'red',
      geometryType: 'circle',
      coordinates: JSON.stringify({ lat: -6.2, lng: 106.8 }),
      radius: 500,
    };
    const validCircleRes = validateRiskZonePayload(validCircle);
    assert(validCircleRes.isValid, 'Validation: Circle with valid center and positive radius is accepted');
  }

  // 3. Polygon Geometry Validation
  {
    // Polygon with only 2 points (invalid)
    const invalidPolygon = {
      name: 'Area Perimeter',
      zoneType: 'yellow',
      geometryType: 'polygon',
      coordinates: JSON.stringify([{ lat: -6.2, lng: 106.8 }, { lat: -6.21, lng: 106.81 }]),
    };
    assert(!validateRiskZonePayload(invalidPolygon).isValid,
      'Validation: Polygon with less than 3 points is rejected');

    // Polygon with 3 valid points
    const validPolygon = {
      name: 'Area Perimeter',
      zoneType: 'yellow',
      geometryType: 'polygon',
      coordinates: JSON.stringify([
        { lat: -6.2, lng: 106.8 },
        { lat: -6.21, lng: 106.81 },
        { lat: -6.22, lng: 106.8 }
      ]),
    };
    assert(validateRiskZonePayload(validPolygon).isValid,
      'Validation: Polygon with 3 points is accepted');
  }

  // 4. Rectangle Geometry Validation
  {
    const invalidRect = {
      name: 'Blok Triase',
      zoneType: 'green',
      geometryType: 'rectangle',
      coordinates: JSON.stringify([{ lat: -6.2, lng: 106.8 }]),
    };
    assert(!validateRiskZonePayload(invalidRect).isValid,
      'Validation: Rectangle with single corner is rejected');

    const validRect = {
      name: 'Blok Triase',
      zoneType: 'green',
      geometryType: 'rectangle',
      coordinates: JSON.stringify([
        { lat: -6.2, lng: 106.8 },
        { lat: -6.21, lng: 106.81 }
      ]),
    };
    assert(validateRiskZonePayload(validRect).isValid,
      'Validation: Rectangle with 2 corners is accepted');
  }

  // 5. Medical Unit Payload & Undefined Fields
  {
    const unitWithUndefined = {
      name: 'Ambulans ALS-01',
      unitCode: 'AMB-01',
      lat: -6.2088,
      lng: 106.8456,
      callsign: undefined,
      notes: undefined,
      imageUrl: undefined,
      crewNames: undefined,
      hospitalReferral: undefined,
    };

    assert(validateMedicalUnitPayload(unitWithUndefined).isValid,
      'Validation: Unit with required fields is valid');

    const cleanedUnit = cleanFirestorePayload(unitWithUndefined);
    assert(!('callsign' in cleanedUnit), 'Sanitize: Unit undefined callsign removed');
    assert(!('notes' in cleanedUnit), 'Sanitize: Unit undefined notes removed');
    assert(!('imageUrl' in cleanedUnit), 'Sanitize: Unit undefined imageUrl removed');
    assert(cleanedUnit.name === 'Ambulans ALS-01', 'Sanitize: Unit name preserved');
    assert(cleanedUnit.lat === -6.2088 && cleanedUnit.lng === 106.8456, 'Sanitize: Unit coordinates preserved');
  }

  // 6. Nested Object & Array Sanitization
  {
    const complexNested = {
      mapId: 'map_123',
      meta: {
        author: 'Admin',
        emptyField: undefined,
        deep: {
          validNumber: 42,
          invalidField: undefined,
        }
      },
      tags: ['medical', undefined, 'urgent'],
    };

    const cleanedNested = cleanFirestorePayload(complexNested);
    assert(!('emptyField' in cleanedNested.meta), 'Sanitize: Deep nested undefined removed');
    assert(!('invalidField' in (cleanedNested.meta.deep as any)), 'Sanitize: Multi-level nested undefined removed');
    assert((cleanedNested.meta.deep as any).validNumber === 42, 'Sanitize: Multi-level number preserved');
    assert(cleanedNested.tags.length === 2 && !cleanedNested.tags.includes(undefined as any),
      'Sanitize: Array undefined elements filtered out');
  }

  console.log(`\nTEST SUMMARY: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
