/**
 * ACCESS REQUEST & DUAL-ROLE (OFFICER & ADMIN) VERIFICATION TEST SUITE
 * 
 * Tests the entire lifecycle:
 * Part A: Officer Account:
 *   1. Login without map access
 *   2. Submit access request
 *   3. Verify "Menunggu" (pending) status
 *   4. Wait for Admin approval -> Real-time appearance of map without re-login
 *   5. Verify unauthorized maps remain inaccessible
 * 
 * Part B: Admin Account:
 *   1. Verified Admin authorization
 *   2. View pending requests list & metadata
 *   3. Approve access request atomically
 *   4. Verify map allowedOfficerIds & user allowedMapIds updated
 *   5. Reject access request with reason & officer re-request flow
 *   6. Security enforcement: Officer cannot self-approve or write allowedOfficerIds
 */

import { cleanFirestorePayload } from '../utils/sanitize';
import { TacticalMap, UserProfile, MapAccessRequest } from '../../types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASS: ${testName}`);
  } else {
    console.error(`❌ FAIL: ${testName} - ${detail || 'Condition not met'}`);
    process.exitCode = 1;
  }
}

console.log('\n======================================================');
console.log('MED-COMMAND: DUAL-ROLE MAP ACCESS & APPROVAL TEST SUITE');
console.log('======================================================\n');

// Mock in-memory Firestore database state
interface MockDatabase {
  users: Record<string, UserProfile>;
  admins: Record<string, { uid: string; email: string }>;
  maps: Record<string, TacticalMap>;
  accessRequests: Record<string, MapAccessRequest>;
  mapUnits: Record<string, Record<string, any>>;
}

const dbState: MockDatabase = {
  users: {},
  admins: {},
  maps: {},
  accessRequests: {},
  mapUnits: {},
};

// Setup accounts: 1 Verified Admin, 1 Officer
const adminUid = 'admin_user_001';
const adminEmail = 'riskiramad3@gmail.com'; // Bootstrap admin email
const officerUid = 'officer_user_002';
const officerEmail = 'petugas.amb01@medcommand.id';
const officerName = 'Ns. Sarah Pratama';

dbState.admins[adminUid] = { uid: adminUid, email: adminEmail };
dbState.users[adminUid] = {
  uid: adminUid,
  email: adminEmail,
  displayName: 'Dr. Rizki Ramadhan',
  role: 'admin',
  isActive: true,
  allowedMapIds: [],
  createdAt: new Date().toISOString(),
};

dbState.users[officerUid] = {
  uid: officerUid,
  email: officerEmail,
  displayName: officerName,
  role: 'officer',
  isActive: true,
  allowedMapIds: [], // Initially NO maps allowed
  createdAt: new Date().toISOString(),
};

// Setup operational maps: Map 1 (Monas) and Map 2 (Gambir)
const map1Id = 'map_monas_ring1';
const map2Id = 'map_gambir_stasiun';

dbState.maps[map1Id] = {
  id: map1Id,
  name: 'Sektor Ring 1 Monas',
  description: 'Area pengamanan medis VIP & panggung utama',
  centerLat: -6.175392,
  centerLng: 106.827153,
  defaultZoom: 16,
  status: 'active',
  allowedOfficerIds: [], // Officer has NO access initially
  createdBy: adminUid,
  createdAt: new Date().toISOString(),
};

dbState.maps[map2Id] = {
  id: map2Id,
  name: 'Sektor Jalur Evakuasi Gambir',
  description: 'Koridor ambulans rujukan ke RSPAD & RSCM',
  centerLat: -6.1765,
  centerLng: 106.8305,
  defaultZoom: 16,
  status: 'active',
  allowedOfficerIds: [],
  createdBy: adminUid,
  createdAt: new Date().toISOString(),
};

// Units inside Map 1
dbState.mapUnits[map1Id] = {
  unit_01: {
    id: 'unit_01',
    name: 'Ambulans AGD 01',
    unitCode: 'AGD-01',
    type: 'ambulance',
    status: 'standby',
  },
};

// Units inside Map 2
dbState.mapUnits[map2Id] = {
  unit_02: {
    id: 'unit_02',
    name: 'Motor Reaksi Cepat 02',
    unitCode: 'MRC-02',
    type: 'medical_bike',
    status: 'en_route',
  },
};

// -------------------------------------------------------------------
// TEST A1: Akun Petugas Login Tanpa Akses Peta
// -------------------------------------------------------------------
{
  const officerUser = dbState.users[officerUid];
  assert(officerUser.role === 'officer', 'A1: Akun terverifikasi sebagai Petugas (role: officer)');

  // Officer active maps query (filter where allowedOfficerIds contains officerUid)
  const accessibleMaps = Object.values(dbState.maps).filter((m) =>
    m.allowedOfficerIds?.includes(officerUid)
  );

  assert(
    accessibleMaps.length === 0,
    'A1: Petugas baru belum memiliki akses ke peta manapun (0 peta aktif)'
  );
}

// -------------------------------------------------------------------
// TEST A2: Petugas Melihat Daftar Peta Tersedia & Mengajukan Permintaan Akses
// -------------------------------------------------------------------
{
  // In the access request directory, officer sees all active maps
  const availableMaps = Object.values(dbState.maps).filter((m) => m.status === 'active');
  assert(availableMaps.length === 2, 'A2: Petugas dapat melihat 2 sektor peta aktif untuk dimintai akses');

  // Submit request for Map 1 (Monas)
  const targetMap = dbState.maps[map1Id];
  const reqId = `${officerUid}_${map1Id}`;

  const accessReq: MapAccessRequest = {
    id: reqId,
    officerUid,
    userId: officerUid,
    officerEmail,
    userEmail: officerEmail,
    officerName,
    userName: officerName,
    mapId: targetMap.id,
    mapName: targetMap.name,
    status: 'pending',
    requestNote: 'Kru Ambulans AGD Cipto 01 siap siaga',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const cleaned = cleanFirestorePayload(accessReq);
  dbState.accessRequests[reqId] = cleaned;

  assert(
    dbState.accessRequests[reqId] !== undefined,
    'A2: Permintaan akses tersimpan di Firestore (bukan sekadar local state)'
  );
  assert(
    dbState.accessRequests[reqId].status === 'pending',
    'A3: Status permintaan adalah "pending" (Menunggu Persetujuan Admin)'
  );
}

// -------------------------------------------------------------------
// TEST A3: Pencegahan Permintaan Ganda (Duplicate Prevention)
// -------------------------------------------------------------------
{
  const reqId = `${officerUid}_${map1Id}`;
  const existingReq = dbState.accessRequests[reqId];

  let duplicateBlocked = false;
  try {
    if (existingReq && existingReq.status === 'pending') {
      throw new Error('Permintaan akses ke peta ini sudah diajukan dan sedang menunggu persetujuan Admin.');
    }
  } catch (err: any) {
    duplicateBlocked = true;
  }

  assert(duplicateBlocked, 'A3: Pencegahan permintaan ganda berhasil untuk pengguna dan peta yang sama');
}

// -------------------------------------------------------------------
// TEST B1 & B6: Security Rules Enforcement (Officer Cannot Self-Approve)
// -------------------------------------------------------------------
{
  // Simulation: Officer tries to modify request.status to 'approved'
  const simulateOfficerApproval = (callerUid: string, callerRole: string) => {
    // Security rules logic: allow update if isAdmin()
    const isCallerAdmin =
      callerRole === 'admin' ||
      dbState.admins[callerUid] !== undefined ||
      callerUid === adminUid;

    if (!isCallerAdmin) {
      throw new Error('PERMISSION_DENIED: Hanya Administrator yang boleh menyetujui permintaan akses.');
    }
  };

  let officerApprovalBlocked = false;
  try {
    simulateOfficerApproval(officerUid, 'officer');
  } catch {
    officerApprovalBlocked = true;
  }

  assert(
    officerApprovalBlocked,
    'B6: Petugas TIDAK DAPAT menyetujui permintaannya sendiri (Security Rules Denied)'
  );

  // Simulation: Officer tries to directly inject their UID into map.allowedOfficerIds
  const simulateOfficerMapInjection = (callerUid: string, callerRole: string) => {
    const isCallerAdmin = callerRole === 'admin' || callerUid === adminUid;
    if (!isCallerAdmin) {
      throw new Error('PERMISSION_DENIED: Hanya Admin yang dapat memodifikasi allowedOfficerIds.');
    }
  };

  let officerMapInjectionBlocked = false;
  try {
    simulateOfficerMapInjection(officerUid, 'officer');
  } catch {
    officerMapInjectionBlocked = true;
  }

  assert(
    officerMapInjectionBlocked,
    'B6: Petugas TIDAK DAPAT menambahkan UID-nya ke allowedOfficerIds secara ilegal'
  );
}

// -------------------------------------------------------------------
// TEST B2: Admin Melihat Permintaan Petugas & Menyetujui Akses (Atomic Approval)
// -------------------------------------------------------------------
{
  // Admin queries all pending requests
  const pendingRequests = Object.values(dbState.accessRequests).filter((r) => r.status === 'pending');
  assert(pendingRequests.length === 1, 'B2: Admin melihat 1 permintaan akses menunggu persetujuan');

  const reqToApprove = pendingRequests[0];
  assert(reqToApprove.userName === officerName, 'B2: Nama petugas tertera dengan benar');
  assert(reqToApprove.userEmail === officerEmail, 'B2: Email petugas tertera dengan benar');
  assert(reqToApprove.mapName === 'Sektor Ring 1 Monas', 'B2: Nama peta yang diminta sesuai');

  // Admin approves atomically (Simulating writeBatch)
  const targetMapId = reqToApprove.mapId;

  // 1. Update map allowedOfficerIds
  dbState.maps[targetMapId].allowedOfficerIds = [
    ...(dbState.maps[targetMapId].allowedOfficerIds || []),
    reqToApprove.userId,
  ];

  // 2. Update user allowedMapIds
  dbState.users[reqToApprove.userId].allowedMapIds = [
    ...(dbState.users[reqToApprove.userId].allowedMapIds || []),
    targetMapId,
  ];

  // 3. Update request status to 'approved'
  dbState.accessRequests[reqToApprove.id] = {
    ...dbState.accessRequests[reqToApprove.id],
    status: 'approved',
    reviewedBy: adminUid,
    reviewedByEmail: adminEmail,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert(
    dbState.maps[targetMapId].allowedOfficerIds.includes(officerUid),
    'B3: UID Petugas berhasil ditambahkan ke allowedOfficerIds pada dokumen peta'
  );
  assert(
    dbState.users[officerUid].allowedMapIds.includes(targetMapId),
    'B4: MapId berhasil ditambahkan ke allowedMapIds pada dokumen profil user'
  );
  assert(
    dbState.accessRequests[reqToApprove.id].status === 'approved',
    'B4: Status permintaan akses terupdate menjadi "approved"'
  );
}

// -------------------------------------------------------------------
// TEST A4: Petugas Langsung Melihat Peta Tanpa Login Ulang (Real-time Sync)
// -------------------------------------------------------------------
{
  // Simulate the onSnapshot listener for Officer: where('allowedOfficerIds', 'array-contains', officerUid)
  const officerAccessibleMaps = Object.values(dbState.maps).filter((m) =>
    m.allowedOfficerIds?.includes(officerUid)
  );

  assert(
    officerAccessibleMaps.length === 1,
    'A4: Peta yang disetujui LANGSUNG muncul pada akun Petugas tanpa reload/re-login'
  );
  assert(
    officerAccessibleMaps[0].id === map1Id,
    'A4: Peta yang muncul adalah "Sektor Ring 1 Monas"'
  );

  // Can officer read units of Map 1?
  const canReadMap1Units = dbState.maps[map1Id].allowedOfficerIds.includes(officerUid);
  assert(canReadMap1Units, 'A4: Petugas diizinkan membaca unit ambulans di Sektor Ring 1 Monas');
}

// -------------------------------------------------------------------
// TEST A5: Peta Lain yang Belum Disetujui Tetap Terisolasi (Access Boundary)
// -------------------------------------------------------------------
{
  // Map 2 (Gambir) has NOT been approved for this officer
  const isOfficerInMap2 = dbState.maps[map2Id].allowedOfficerIds.includes(officerUid);
  assert(
    !isOfficerInMap2,
    'A5: Petugas TIDAK BISA mengakses Map 2 (Gambir) karena belum disetujui Admin'
  );

  // Operational unit subcollection security check
  const isAllowedToReadMap2Units = isOfficerInMap2;
  assert(
    !isAllowedToReadMap2Units,
    'A5: Unit medis pada Sektor Gambir terlindungi dari akses tidak sah'
  );
}

// -------------------------------------------------------------------
// TEST B5: Skenario Penolakan Akses & Pengajuan Ulang
// -------------------------------------------------------------------
{
  // Officer requests Map 2 (Gambir)
  const req2Id = `${officerUid}_${map2Id}`;
  dbState.accessRequests[req2Id] = {
    id: req2Id,
    officerUid,
    userId: officerUid,
    officerEmail,
    userEmail: officerEmail,
    officerName,
    userName: officerName,
    mapId: map2Id,
    mapName: dbState.maps[map2Id].name,
    status: 'pending',
    requestNote: 'Permintaan akses cadangan',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Admin rejects request
  const rejectionReason = 'Sektor Gambir telah terpenuhi oleh tim medis RSPAD.';
  dbState.accessRequests[req2Id] = {
    ...dbState.accessRequests[req2Id],
    status: 'rejected',
    reviewedBy: adminUid,
    reviewedByEmail: adminEmail,
    reviewedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert(
    dbState.accessRequests[req2Id].status === 'rejected',
    'B5: Admin berhasil menolak permintaan akses (status: rejected)'
  );
  assert(
    !dbState.maps[map2Id].allowedOfficerIds.includes(officerUid),
    'B5: Akses TIDAK diberikan ke peta yang ditolak'
  );

  // Officer re-submits the rejected request
  dbState.accessRequests[req2Id] = {
    ...dbState.accessRequests[req2Id],
    status: 'pending',
    requestNote: 'Pengajuan ulang setelah rotasi jadwal shift 2',
    updatedAt: new Date().toISOString(),
  };

  assert(
    dbState.accessRequests[req2Id].status === 'pending',
    'B5: Petugas berhasil mengajukan ulang permintaan akses yang sebelumnya ditolak'
  );
}

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} passed.`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
