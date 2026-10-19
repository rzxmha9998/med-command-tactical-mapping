import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../config';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

export interface UploadProgressCallback {
  (progress: number): void;
}

export async function uploadVehicleImage(
  file: File,
  unitCode: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Format gambar tidak didukung. Harap gunakan JPEG, PNG, atau WebP.');
  }

  // Validate file size
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Ukuran gambar melebihi batas maksimal 5 MB.');
  }

  const cleanCode = unitCode.replace(/[^a-zA-Z0-9_-]/g, '_') || 'unit';
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop() || 'jpg';
  const storagePath = `vehicles/${cleanCode}_${timestamp}.${fileExt}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        unitCode,
        uploadedAt: new Date().toISOString(),
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        reject(new Error(`Gagal mengunggah gambar kendaraan: ${error.message}`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadUrl);
        } catch (err) {
          reject(new Error('Gagal mendapatkan URL gambar setelah unggah.'));
        }
      }
    );
  });
}
