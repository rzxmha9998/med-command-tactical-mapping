import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config';

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadProgressCallback {
  (progress: number, bytesTransferred: number, totalBytes: number): void;
}

export interface VehicleImageUploadMetrics {
  uploadDurationMs: number;
  downloadUrlDurationMs: number;
  totalDurationMs: number;
  fileSizeBytes: number;
  contentType: string;
}

export interface VehicleImageUploadResult {
  downloadUrl: string;
  storagePath: string;
  metrics: VehicleImageUploadMetrics;
}

export interface UploadVehicleImageOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Validates vehicle image file format and file size
 */
export function validateVehicleImageFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'File gambar tidak ditemukan.' };
  }

  // Validate MIME type strictly to JPEG, PNG, WebP
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      error: `Format gambar "${file.type || 'tidak diketahui'}" tidak didukung. Harap gunakan format JPEG, PNG, atau WebP.`,
    };
  }

  // Validate maximum 5 MB
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `Ukuran gambar (${sizeMb} MB) melebihi batas maksimal 5 MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Uploads vehicle image to Firebase Storage with progress tracking, timeout handling, and profiling
 */
export async function uploadVehicleImage(
  file: File,
  unitCode: string,
  onProgress?: UploadProgressCallback,
  options?: UploadVehicleImageOptions
): Promise<VehicleImageUploadResult> {
  // 1. Validation check
  const validation = validateVehicleImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const cleanCode = unitCode.replace(/[^a-zA-Z0-9_-]/g, '_') || 'unit';
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const storagePath = `vehicles/${cleanCode}_${timestamp}.${fileExt}`;
  const storageRef = ref(storage, storagePath);

  const timeoutMs = options?.timeoutMs ?? 30000; // 30s timeout
  const startTime = performance.now();
  let uploadFinishedTime = 0;

  return new Promise<VehicleImageUploadResult>((resolve, reject) => {
    let isSettled = false;

    // Timeout guard to prevent hanging indefinitely
    const timeoutId = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        try {
          uploadTask.cancel();
        } catch {
          // ignore task cancellation error
        }
        reject(
          new Error(
            `Waktu unggah foto melebihi batas (${Math.round(
              timeoutMs / 1000
            )} detik). Periksa koneksi internet Anda dan coba lagi.`
          )
        );
      }
    }, timeoutMs);

    // AbortSignal support
    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeoutId);
          try {
            uploadTask.cancel();
          } catch {
            // ignore
          }
          reject(new Error('Proses unggah foto dibatalkan oleh pengguna.'));
        }
      });
    }

    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        unitCode,
        uploadedAt: new Date().toISOString(),
        originalFileName: file.name.slice(0, 80),
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        if (isSettled) return;
        const progress = snapshot.totalBytes > 0 ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 : 0;
        onProgress?.(Math.round(progress), snapshot.bytesTransferred, snapshot.totalBytes);
      },
      (error) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timeoutId);
        console.error('[MED-COMMAND Storage] Upload error:', error.code, error.message);

        let userFriendlyMsg = `Gagal mengunggah gambar kendaraan: ${error.message}`;
        if (error.code === 'storage/unauthorized') {
          userFriendlyMsg = 'Gagal mengunggah foto: Izin ditolak oleh Firebase Storage. Pastikan Anda telah login.';
        } else if (error.code === 'storage/canceled') {
          userFriendlyMsg = 'Proses unggah foto dibatalkan.';
        } else if (error.code === 'storage/retry-limit-exceeded') {
          userFriendlyMsg = 'Batas waktu jaringan terlampaui saat mengunggah foto. Periksa koneksi internet Anda.';
        }

        reject(new Error(userFriendlyMsg));
      },
      async () => {
        if (isSettled) return;
        clearTimeout(timeoutId);
        uploadFinishedTime = performance.now();
        const uploadDurationMs = uploadFinishedTime - startTime;

        try {
          const tUrlStart = performance.now();
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const tUrlEnd = performance.now();
          const downloadUrlDurationMs = tUrlEnd - tUrlStart;
          const totalDurationMs = tUrlEnd - startTime;

          isSettled = true;
          resolve({
            downloadUrl,
            storagePath,
            metrics: {
              uploadDurationMs,
              downloadUrlDurationMs,
              totalDurationMs,
              fileSizeBytes: file.size,
              contentType: file.type,
            },
          });
        } catch (err: any) {
          if (isSettled) return;
          isSettled = true;
          console.error('[MED-COMMAND Storage] getDownloadURL error:', err);
          reject(new Error(`Gagal mendapatkan URL publik gambar setelah unggah: ${err.message}`));
        }
      }
    );
  });
}
