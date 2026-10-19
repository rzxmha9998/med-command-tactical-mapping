import {
  getVehicleSvgByType,
  getRotatorStatusClass,
  getRotatorLightbarHtml,
  getTacticalMarkerInnerHtml,
} from './TacticalVehicleIcon';
import { cleanFirestorePayload } from '../../firebase/utils/sanitize';
import { UnitType, UnitStatus } from '../../types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    console.error(`❌ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('MED-COMMAND: TACTICAL VEHICLE & ROTATOR TEST SUITE');
console.log('======================================================\n');

// 1. VEHICLE SVG GENERATION FOR ALL 5 VEHICLE TYPES
console.log('--- 1. TACTICAL BUILT-IN VEHICLE ICONS ---');
const vehicleTypes: UnitType[] = [
  'ambulance',
  'ambulance_referral',
  'medical_bike',
  'response_bike',
  'other',
];

vehicleTypes.forEach((type) => {
  const svg = getVehicleSvgByType(type, 32);
  assert(svg.includes('<svg') && svg.includes('</svg>'), `Ikon SVG untuk ${type} valid dan berisi elemen <svg>`);
});

// Specific architectural details per type
const agdSvg = getVehicleSvgByType('ambulance', 32);
assert(agdSvg.includes('#EF4444'), 'Ambulans AGD menggunakan aksen merah darurat (#EF4444)');

const referralSvg = getVehicleSvgByType('ambulance_referral', 32);
assert(referralSvg.includes('#0284C7'), 'Ambulans Rujukan menggunakan aksen biru rujukan (#0284C7)');

const medBikeSvg = getVehicleSvgByType('medical_bike', 32);
assert(medBikeSvg.includes('stroke="#38BDF8"'), 'Motor Medis Reaksi Cepat memiliki fairing taktis cyan');

const triageBikeSvg = getVehicleSvgByType('response_bike', 32);
assert(triageBikeSvg.includes('#F59E0B') || triageBikeSvg.includes('#FBBF24'), 'Motor Respons Triase memiliki aksen triage amber');

const clinicSvg = getVehicleSvgByType('other', 32);
assert(clinicSvg.includes('#10B981'), 'Pos Medis Bergerak memiliki aksen shelter hijau komando (#10B981)');

// 2. ROTATOR MERAH-BIRU SYSTEM & STATUS BEHAVIOR
console.log('\n--- 2. ROTATOR MERAH-BIRU LIGHTBAR STROBES ---');
assert(getRotatorStatusClass('en_route') === 'rotator-active-enroute', 'Status en_route memicu kelas rotator-active-enroute');
assert(getRotatorStatusClass('on_duty') === 'rotator-active-onduty', 'Status on_duty memicu kelas rotator-active-onduty');
assert(getRotatorStatusClass('standby') === 'rotator-active-standby', 'Status standby memicu kelas rotator-active-standby');
assert(getRotatorStatusClass('inactive') === 'rotator-inactive', 'Status inactive memicu kelas rotator-inactive');

// Check HTML structure of rotator lightbar
const enRouteRotator = getRotatorLightbarHtml('en_route', false);
assert(enRouteRotator.includes('lamp-red') && enRouteRotator.includes('lamp-blue'), 'Rotator memiliki dua lampu strobo: Merah & Biru');
assert(enRouteRotator.includes('rotator-active-enroute'), 'Rotator memuat kelas animasi aktif untuk en_route');
assert(enRouteRotator.includes('rotator-halo'), 'Rotator aktif memiliki efek bloom / halo visual');

const inactiveRotator = getRotatorLightbarHtml('inactive', false);
assert(inactiveRotator.includes('opacity-20'), 'Unit inactive memiliki lampu yang redup / off tanpa strobo');
assert(!inactiveRotator.includes('rotator-halo'), 'Unit inactive tidak memancarkan halo');

// 3. HEADING GPS & ROTATION
console.log('\n--- 3. HEADING GPS ROTATION ---');
const htmlWithHeading = getTacticalMarkerInnerHtml('ambulance', 'en_route', 'AMB-01', 135, false);
assert(htmlWithHeading.includes('transform: rotate(135deg)'), 'Heading 135° menghasilkan CSS rotate(135deg) pada ikon');

const htmlWithoutHeading = getTacticalMarkerInnerHtml('ambulance', 'en_route', 'AMB-01', undefined, false);
assert(!htmlWithoutHeading.includes('transform: rotate('), 'Tanpa heading GPS, tidak ada rotasi palsu yang diterapkan');

// 4. MARKER HTML INTEGRITY & CALLSIGN BADGE
console.log('\n--- 4. TACTICAL MARKER STRUCTURE ---');
const markerHtml = getTacticalMarkerInnerHtml('ambulance', 'en_route', 'AMB-01', 90, true);
assert(markerHtml.includes('AMB-01'), 'Marker memuat badge kode unit AMB-01');
assert(markerHtml.includes('lamp-red') && markerHtml.includes('lamp-blue'), 'Marker Leaflet memuat rotator merah-biru langsung di atas kendaraan');
assert(markerHtml.includes('ring-3 ring-[#2A9D8F]'), 'Unit yang dipilih (selected) memiliki tactical ring hijau toska');

// 5. SANITIZATION & HEADING PRESERVATION
console.log('\n--- 5. FIRESTORE PAYLOAD SANITIZATION ---');
const payloadWithHeading = cleanFirestorePayload({
  name: 'Ambulans AGD 1',
  unitCode: 'AGD-01',
  lat: -6.175,
  lng: 106.827,
  heading: 270,
  speed: 45.5,
  notes: undefined,
});

assert(payloadWithHeading.heading === 270, 'Heading GPS (270°) tersimpan utuh di payload Firestore');
assert(payloadWithHeading.speed === 45.5, 'Kecepatan GPS (45.5 km/h) tersimpan utuh di payload Firestore');
assert(!('notes' in payloadWithHeading), 'Field undefined (notes) dibersihkan dari payload');

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} passed.`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
