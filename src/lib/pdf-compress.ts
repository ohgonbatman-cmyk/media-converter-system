import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';

export async function compressPdf(
  fileBuffer: ArrayBuffer,
  quality: number,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(fileBuffer);

  // We iterate through all objects to find images
  const enumerateObjects = (pdfDoc as any).context.enumerateIndirectObjects();
  const imageObjects: any[] = [];

  for (const [ref, obj] of enumerateObjects) {
    if (obj instanceof PDFRawStream) {
      const dict = obj.dict;
      const subtype = dict.get(PDFName.of('Subtype'));
      if (subtype === PDFName.of('Image')) {
        imageObjects.push({ ref, obj });
      }
    }
  }

  const totalImages = imageObjects.length;
  
  for (let i = 0; i < totalImages; i++) {
    const { ref, obj } = imageObjects[i];
    const dict = obj.dict;
    
    try {
      const width = dict.get(PDFName.of('Width'))?.toString();
      const height = dict.get(PDFName.of('Height'))?.toString();
      const filter = dict.get(PDFName.of('Filter'))?.toString();

      // Only attempt to compress if we have dimensions and it's not already highly compressed or unsupported
      if (width && height && typeof document !== 'undefined') {
        const w = parseInt(width);
        const h = parseInt(height);

        // Extract raw data
        const rawData = obj.contents;
        
        // Use browser Canvas to re-compress the image
        // Special handling might be needed for different filters (e.g. FlateDecode vs DCTDecode)
        // But for many PDFs, we can try to render it to canvas.
        
        const compressedData = await compressImageWithCanvas(rawData, w, h, quality, filter);
        if (compressedData && compressedData.length < rawData.length) {
          // Replace the stream contents
          const newStream = (pdfDoc as any).context.flateStream(compressedData, {
            ...dict.entries(),
            [PDFName.of('Filter').toString()]: PDFName.of('FlateDecode'),
            [PDFName.of('Length').toString()]: compressedData.length,
          });
          (pdfDoc as any).context.assign(ref, newStream);
        }
      }
    } catch (e) {
      console.warn('Failed to compress image object', i, e);
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalImages) * 100));
    }
  }

  return await pdfDoc.save();
}

async function compressImageWithCanvas(
  data: Uint8Array,
  width: number,
  height: number,
  quality: number,
  filter?: string
): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    try {
      const blob = new Blob([data as any], { type: filter?.includes('DCT') ? 'image/jpeg' : 'image/png' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        
        // Downsample if quality is low (Strong Compression)
        let scale = 1;
        if (quality < 0.5) scale = 0.7; // Strong
        else if (quality < 0.8) scale = 0.85; // Recommended
        
        canvas.width = width * scale;
        canvas.height = height * scale;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Export to JPEG with quality
        canvas.toBlob((resultBlob) => {
          if (!resultBlob) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(new Uint8Array(reader.result as ArrayBuffer));
          };
          reader.readAsArrayBuffer(resultBlob);
        }, 'image/jpeg', quality);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      img.src = url;
    } catch (e) {
      resolve(null);
    }
  });
}
