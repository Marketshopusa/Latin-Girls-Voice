type MediaType = 'image' | 'video' | null;

function getDataUrlMime(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:([^;]+);base64,/i);
  return match?.[1]?.toLowerCase() ?? null;
}

function waitFor<T extends { addEventListener: any; removeEventListener: any }>(
  target: T,
  event: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onOk = () => {
      cleanup();
      resolve();
    };

    const onErr = () => {
      cleanup();
      reject(new Error(`No se pudo procesar el archivo (evento: ${event})`));
    };

    const cleanup = () => {
      target.removeEventListener(event, onOk);
      target.removeEventListener('error', onErr);
    };

    target.addEventListener(event, onOk, { once: true });
    target.addEventListener('error', onErr, { once: true });
  });
}

async function extractVideoFrameDataUrl(
  videoDataUrl: string,
  seekTimeSeconds = 0.2
): Promise<string> {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = videoDataUrl;

  // Esperar a que haya datos suficientes para conocer dimensiones
  await Promise.race([waitFor(video, 'loadeddata'), waitFor(video, 'loadedmetadata')]);

  const duration = Number.isFinite(video.duration) ? video.duration : 0;
  const safeTime = duration
    ? Math.min(Math.max(seekTimeSeconds, 0), Math.max(duration - 0.1, 0))
    : 0;

  if (safeTime > 0) {
    try {
      video.currentTime = safeTime;
      await waitFor(video, 'seeked');
    } catch {
      // Si falla el seek (algunos móviles), seguimos con el primer frame disponible.
    }
  }

  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) {
    throw new Error('No se pudo leer el video. Prueba con otro archivo o con MP4/WebM.');
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el canvas');

  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.92);
}

async function rasterizeImageDataUrlToJpeg(options: {
  dataUrl: string;
  maxDimension: number;
  quality: number;
}): Promise<string> {
  const { dataUrl, maxDimension, quality } = options;

  const img = new Image();
  // data: URLs no requieren CORS
  img.src = dataUrl;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('No se pudo leer la imagen (formato no compatible).'));
  });

  const w0 = img.naturalWidth || img.width;
  const h0 = img.naturalHeight || img.height;
  if (!w0 || !h0) {
    throw new Error('No se pudo leer la imagen (dimensiones inválidas).');
  }

  const scale = Math.min(1, maxDimension / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * scale));
  const h = Math.max(1, Math.round(h0 * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el canvas');

  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function mediaToAiImageDataUrl(params: {
  mediaUrl: string;
  mediaType: MediaType;
  maxDimension?: number;
  quality?: number;
}): Promise<string> {
  const maxDimension = params.maxDimension ?? 1280;
  const quality = params.quality ?? 0.9;

  // 1) Si es video, extraer un frame
  const baseImageUrl =
    params.mediaType === 'video'
      ? await extractVideoFrameDataUrl(params.mediaUrl)
      : params.mediaUrl;

  // 2) Convertir cualquier cosa (GIF/WEBP/HEIC si el navegador lo decodifica) a JPG
  //    Esto asegura que el backend reciba siempre un formato estándar.
  const mime = getDataUrlMime(baseImageUrl);
  if (!mime) return baseImageUrl;

  // Si ya es jpeg/jpg, igual reducimos tamaño por performance.
  return rasterizeImageDataUrlToJpeg({
    dataUrl: baseImageUrl,
    maxDimension,
    quality,
  });
}
