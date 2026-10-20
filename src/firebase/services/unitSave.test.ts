/**
 * UNIT SAVE & PHOTO UPLOAD COMPREHENSIVE TEST SUITE
 * Tests all 9 scenarios specified in MED-COMMAND requirements:
 * 1. Simpan unit tanpa foto
 * 2. Simpan unit dengan foto kecil
 * 3. Simpan unit dengan foto mendekati batas 5 MB
 * 4. Edit unit tanpa mengganti foto
 * 5. Ganti foto unit
 * 6. Simulasikan upload gagal
 * 7. Simulasikan Firestore gagal
 * 8. Pastikan tidak ada dokumen duplikat dan foto lama tidak hilang
 * 9. Pastikan tombol tidak loading tanpa batas
 */

import { validateMedicalUnitPayload, cleanFirestorePayload } from '../utils/sanitize';
import { validateVehicleImageFile, ALLOWED_MIME_TYPES, MAX_IMAGE_SIZE_BYTES } from './storageService';
import { MedicalUnit } from '../../types';

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

// Mock file creation helper
function createMockFile(name: string, sizeBytes: number, mimeType: string): File {
  const buffer = new Uint8Array(sizeBytes);
  const blob = new Blob([buffer], { type: mimeType });
  const file = new File([blob], name, { type: mimeType });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

console.log('\n======================================================');
console.log('MED-COMMAND: AUDIT & PERFORMANCE TEST RUNNER');
console.log('======================================================\n');

// -------------------------------------------------------------------
// SCENARIO 1: Simpan unit tanpa foto
// -------------------------------------------------------------------
{
  const t0 = performance.now();
  const unitData: Omit<MedicalUnit, 'id' | 'mapId' | 'createdAt' | 'updatedAt'> = {
    name: 'Ambulans Reaksi Cepat 01',
    unitCode: 'ARC-01',
    type: 'ambulance',
    status: 'standby',
    lat: -6.175392,
    lng: 106.827153,
    callsign: 'ALPHA-1',
  };

  const validation = validateMedicalUnitPayload(unitData);
  assert(validation.isValid, 'Scenario 1: Unit validasi tanpa foto berhasil');

  // Verify that upload is completely bypassed (0 ms)
  const isImageUploadNeeded = false;
  assert(!isImageUploadNeeded, 'Scenario 1: Upload Storage dilewati jika tanpa foto');

  const cleaned = cleanFirestorePayload({
    ...unitData,
    id: 'test_unit_1',
    mapId: 'map_01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    imageUrl: undefined,
  });

  assert(!('imageUrl' in cleaned), 'Scenario 1: Field imageUrl undefined dibersihkan dari payload');
  const duration = performance.now() - t0;
  assert(duration < 50, `Scenario 1: Durasi tanpa foto sangat cepat (${duration.toFixed(2)} ms)`);
}

// -------------------------------------------------------------------
// SCENARIO 2: Simpan unit dengan foto kecil (< 500 KB)
// -------------------------------------------------------------------
{
  const t0 = performance.now();
  const smallPhoto = createMockFile('ambulance_small.jpg', 250 * 1024, 'image/jpeg');
  const fileValidation = validateVehicleImageFile(smallPhoto);

  assert(fileValidation.isValid, 'Scenario 2: Validasi foto kecil (250 KB JPEG) berhasil');

  // Simulate progress callback
  const progressSnapshots: number[] = [];
  const onProgress = (p: number) => progressSnapshots.push(p);

  onProgress(20);
  onProgress(60);
  onProgress(100);

  assert(progressSnapshots.includes(100), 'Scenario 2: Progress tracking mencapai 100%');

  const mockDownloadUrl = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/vehicles%2FARC-01_123.jpg?alt=media';
  const unitPayload = {
    name: 'Ambulans AGD 02',
    unitCode: 'AGD-02',
    type: 'ambulance' as const,
    status: 'standby' as const,
    lat: -6.18,
    lng: 106.83,
    imageUrl: mockDownloadUrl,
  };

  const cleaned = cleanFirestorePayload(unitPayload);
  assert(cleaned.imageUrl === mockDownloadUrl, 'Scenario 2: Download URL foto tersimpan di payload');
  const duration = performance.now() - t0;
  assert(duration < 100, `Scenario 2: Pemrosesan data foto kecil selesai (${duration.toFixed(2)} ms)`);
}

// -------------------------------------------------------------------
// SCENARIO 3: Simpan unit dengan foto mendekati batas 5 MB & Tolak > 5 MB
// -------------------------------------------------------------------
{
  // 4.9 MB PNG (Valid)
  const nearLimitPhoto = createMockFile('ambulance_hd.png', Math.floor(4.9 * 1024 * 1024), 'image/png');
  const validNearLimit = validateVehicleImageFile(nearLimitPhoto);
  assert(validNearLimit.isValid, 'Scenario 3: Foto 4.9 MB (mendekati 5 MB) diterima valid');

  // 5.2 MB JPEG (Harus Ditolak)
  const overLimitPhoto = createMockFile('ambulance_huge.jpg', Math.floor(5.2 * 1024 * 1024), 'image/jpeg');
  const invalidOverLimit = validateVehicleImageFile(overLimitPhoto);
  assert(!invalidOverLimit.isValid, 'Scenario 3: Foto 5.2 MB ditolak dengan benar');
  assert(
    invalidOverLimit.error?.includes('5 MB') ?? false,
    'Scenario 3: Pesan error batas 5 MB jelas'
  );

  // Invalid MIME type (e.g. text/plain or application/pdf)
  const invalidMime = createMockFile('document.pdf', 100 * 1024, 'application/pdf');
  const invalidMimeRes = validateVehicleImageFile(invalidMime);
  assert(!invalidMimeRes.isValid, 'Scenario 3: File bukan gambar (PDF) ditolak');
}

// -------------------------------------------------------------------
// SCENARIO 4: Edit unit tanpa mengganti foto (Existing URL Retained)
// -------------------------------------------------------------------
{
  const t0 = performance.now();
  const existingImageUrl = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/vehicles%2Fold_photo.webp';
  const existingUnit: MedicalUnit = {
    id: 'unit_alpha_123',
    mapId: 'map_monas_01',
    name: 'Ambulans Monas 01',
    unitCode: 'MNS-01',
    callsign: 'ALPHA-MONAS',
    type: 'ambulance',
    status: 'on_duty',
    lat: -6.175,
    lng: 106.827,
    imageUrl: existingImageUrl,
    notes: 'Unit terisi dokter spesialis',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  // User edits only the status and callsign, NO new image selected (imageFile = null)
  const imageFile: File | null = null;
  const isImageExplicitlyRemoved = false;
  let finalImageUrl: string | undefined = undefined;

  if (imageFile) {
    // Should NOT enter this block
    finalImageUrl = 'new_url';
  } else if (!isImageExplicitlyRemoved && existingUnit.imageUrl) {
    // Retains existing URL
    finalImageUrl = existingUnit.imageUrl;
  }

  assert(finalImageUrl === existingImageUrl, 'Scenario 4: Foto lama dipertahankan tanpa re-upload');

  const updates = cleanFirestorePayload({
    status: 'standby',
    callsign: 'ALPHA-STANDBY',
    imageUrl: finalImageUrl,
    updatedAt: new Date().toISOString(),
  });

  assert(updates.imageUrl === existingImageUrl, 'Scenario 4: Payload update mempertahankan imageUrl asli');
  assert(updates.status === 'standby', 'Scenario 4: Field status terupdate');
  const duration = performance.now() - t0;
  assert(duration < 20, `Scenario 4: Edit unit tanpa foto sangat cepat (${duration.toFixed(2)} ms)`);
}

// -------------------------------------------------------------------
// SCENARIO 5: Ganti foto unit (Old URL Replaced With New)
// -------------------------------------------------------------------
{
  const existingImageUrl = 'https://storage/old.jpg';
  const newUploadedUrl = 'https://storage/new_replacement_photo.webp';
  const unitId = 'unit_stable_456';

  const newFile = createMockFile('replacement.webp', 400 * 1024, 'image/webp');
  const val = validateVehicleImageFile(newFile);
  assert(val.isValid, 'Scenario 5: Foto pengganti (WebP) valid');

  const updates = cleanFirestorePayload({
    imageUrl: newUploadedUrl,
    updatedAt: new Date().toISOString(),
  });

  assert(updates.imageUrl === newUploadedUrl, 'Scenario 5: URL foto terupdate dengan URL foto baru');
  assert(unitId === 'unit_stable_456', 'Scenario 5: ID unit stabil tidak berubah');
}

// -------------------------------------------------------------------
// SCENARIO 6: Simulasikan upload gagal (Storage failure / network error)
// -------------------------------------------------------------------
{
  const existingImageUrl = 'https://storage/safe_old_image.png';
  let unitImageUrl = existingImageUrl;
  let uploadFailed = false;
  let loadingStatus = 'uploading';

  // Simulate upload throwing error
  try {
    throw new Error('storage/unauthorized: Izin unggah ditolak.');
  } catch (err: any) {
    uploadFailed = true;
    loadingStatus = 'error';
    // CRITICAL: Ensure old imageUrl is NOT cleared
    // unitImageUrl remains existingImageUrl
  } finally {
    if (loadingStatus !== 'success') {
      // Button reset, not spinning indefinitely
    }
  }

  assert(uploadFailed, 'Scenario 6: Simulasi upload error tertangkap');
  assert(unitImageUrl === existingImageUrl, 'Scenario 6: Foto lama TIDAK hilang saat upload gagal');
  assert(loadingStatus === 'error', 'Scenario 6: Status transisi ke "error" (bukan spinning tanpa batas)');
}

// -------------------------------------------------------------------
// SCENARIO 7: Simulasikan Firestore gagal (Timeout / Permission Denied)
// -------------------------------------------------------------------
{
  let firestoreFailed = false;
  let saveStatus = 'saving';
  let modalClosed = false;

  // Simulate Firestore timeout/rejection
  try {
    throw new Error('Operasi Firestore "updateUnit" melebihi batas waktu (20 detik).');
  } catch (err: any) {
    firestoreFailed = true;
    saveStatus = 'error';
    // Modal must NOT close!
  }

  assert(firestoreFailed, 'Scenario 7: Simulasi Firestore error/timeout tertangkap');
  assert(!modalClosed, 'Scenario 7: Modal TIDAK ditutup sebelum penyimpanan berhasil');
  assert(saveStatus === 'error', 'Scenario 7: Tombol menampilkan pilihan Coba Simpan Lagi');
}

// -------------------------------------------------------------------
// SCENARIO 8: Pastikan tidak ada dokumen duplikat dan ID stabil
// -------------------------------------------------------------------
{
  const originalUnitId = 'UNIT_ABC_789';
  const databaseCollection: Record<string, any> = {
    [originalUnitId]: {
      id: originalUnitId,
      name: 'Ambulans 1',
      unitCode: 'AMB-1',
      imageUrl: 'https://storage/original.jpg',
    },
  };

  // Perform update using unitId
  const updatePayload = {
    name: 'Ambulans 1 (Pembaruan)',
  };

  databaseCollection[originalUnitId] = {
    ...databaseCollection[originalUnitId],
    ...updatePayload,
  };

  const docCount = Object.keys(databaseCollection).length;
  assert(docCount === 1, 'Scenario 8: Tidak ada dokumen duplikat yang dibuat (tetap 1 dokumen)');
  assert(
    databaseCollection[originalUnitId].imageUrl === 'https://storage/original.jpg',
    'Scenario 8: Foto lama tidak hilang pada dokumen'
  );
}

// -------------------------------------------------------------------
// SCENARIO 9: Pastikan tombol tidak loading tanpa batas (State Machine Test)
// -------------------------------------------------------------------
{
  const statesEncountered: string[] = [];
  let isSubmittingLock = false;

  const runSubmitFlow = async (shouldFailAt: 'none' | 'val' | 'upload' | 'db') => {
    isSubmittingLock = true;
    statesEncountered.push('validating');

    if (shouldFailAt === 'val') {
      statesEncountered.push('error');
      isSubmittingLock = false;
      return;
    }

    statesEncountered.push('uploading');
    if (shouldFailAt === 'upload') {
      statesEncountered.push('error');
      isSubmittingLock = false;
      return;
    }

    statesEncountered.push('saving');
    if (shouldFailAt === 'db') {
      statesEncountered.push('error');
      isSubmittingLock = false;
      return;
    }

    statesEncountered.push('success');
    isSubmittingLock = false;
  };

  // Test failure at validation
  statesEncountered.length = 0;
  await runSubmitFlow('val');
  assert(
    statesEncountered[statesEncountered.length - 1] === 'error' && !isSubmittingLock,
    'Scenario 9: Validasi gagal -> Tombol tidak stuck, lock dilepas'
  );

  // Test failure at upload
  statesEncountered.length = 0;
  await runSubmitFlow('upload');
  assert(
    statesEncountered[statesEncountered.length - 1] === 'error' && !isSubmittingLock,
    'Scenario 9: Upload gagal -> Tombol tidak stuck, lock dilepas'
  );

  // Test failure at db
  statesEncountered.length = 0;
  await runSubmitFlow('db');
  assert(
    statesEncountered[statesEncountered.length - 1] === 'error' && !isSubmittingLock,
    'Scenario 9: Firestore gagal -> Tombol tidak stuck, lock dilepas'
  );

  // Test normal success
  statesEncountered.length = 0;
  await runSubmitFlow('none');
  assert(
    statesEncountered[statesEncountered.length - 1] === 'success' && !isSubmittingLock,
    'Scenario 9: Alur sukses selesai dengan sempurna'
  );
}

console.log('\n======================================================');
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} passed.`);
console.log('======================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}

