import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

const MAX_DIM = 512;
const TARGET_BYTES = 100 * 1024;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

export interface ProcessedCrest {
  blob: Blob;
  ext: string;
  contentType: string;
  dataUrl: string;
}

export async function processCrestFile(file: File): Promise<ProcessedCrest> {
  const img = await loadImage(file);
  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  if (!w0 || !h0) throw new Error('Nevažeća slika.');

  const scale = Math.min(1, MAX_DIM / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas nije dostupan.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const qualities = [0.92, 0.82, 0.72, 0.6, 0.45, 0.3];
  const types: { type: string; ext: string }[] = [
    { type: 'image/webp', ext: 'webp' },
    { type: 'image/jpeg', ext: 'jpg' },
  ];
  for (const { type, ext } of types) {
    for (const q of qualities) {
      const blob = await canvasToBlob(canvas, type, q);
      if (blob && blob.size <= TARGET_BYTES) {
        return { blob, ext, contentType: type, dataUrl: await blobToDataUrl(blob) };
      }
    }
  }
  const fallback = await canvasToBlob(canvas, 'image/jpeg', 0.3);
  if (!fallback) throw new Error('Obrada slike nije uspjela.');
  return { blob: fallback, ext: 'jpg', contentType: 'image/jpeg', dataUrl: await blobToDataUrl(fallback) };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export async function uploadCrest(
  teamId: string,
  processed: ProcessedCrest,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const path = `team-crests/${teamId}.${processed.ext}`;
  const r = ref(storage, path);
  onProgress?.(10);
  await uploadBytes(r, processed.blob, { contentType: processed.contentType });
  onProgress?.(80);
  const url = await getDownloadURL(r);
  onProgress?.(100);
  return url;
}

export async function deleteCrestByUrl(url: string): Promise<void> {
  try {
    const r = ref(storage, url);
    await deleteObject(r);
  } catch {
    // File may already be gone — ignore.
  }
}
