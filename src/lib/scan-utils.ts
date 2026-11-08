// Utilitaires de hash et de matching pour le scanner

export const calculateHashFromImage = async (imgData: Blob | string): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '0'.repeat(64);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  if (typeof imgData === 'string') {
    img.src = imgData;
  } else {
    img.src = URL.createObjectURL(imgData);
  }
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image load failed'));
  });
  ctx.drawImage(img, 0, 0, 8, 8);
  if (typeof imgData !== 'string') URL.revokeObjectURL(img.src);
  const imgDataOut = ctx.getImageData(0, 0, 8, 8).data;
  let hash = BigInt(0);
  for (let i = 0; i < imgDataOut.length; i += 4) {
    const gray = imgDataOut[i] * 0.3 + imgDataOut[i + 1] * 0.59 + imgDataOut[i + 2] * 0.11;
    hash = (hash << BigInt(1)) | BigInt(gray > 128 ? 1 : 0);
  }
  return hash.toString(16);
};

export const compareHashes = (
  hashBlob: string,
  database: Array<{ hash: string; id: string; name: string; image_url: string }>,
  topN: number = 5
) => {
  const results = database.map((item) => {
    const a = BigInt('0x' + hashBlob);
    const b = BigInt('0x' + item.hash);
    const different = a ^ b;
    const hammingDistance = different.toString(2).split('0').join('').length;
    const score = 1 - hammingDistance / 64;
    return {
      id: item.id,
      name: item.name,
      image_url: item.image_url,
      confidence: Math.max(0, Math.min(1, score)),
    };
  });
  return results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, topN);
};
