export const compressImage = (file, maxWidth = 1000, maxHeight = 1250, quality = 0.8) => {
  return new Promise((resolve) => {
    // If not in a browser environment, return original file
    if (typeof window === 'undefined' || !window.FileReader || !window.Image) {
      return resolve(file);
    }

    // Skip compression for non-image files
    if (!file.type || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions preserving aspect ratio
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob/file
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = (err) => {
        console.warn('Image loading failed for compression, using original:', err);
        resolve(file);
      };
    };
    reader.onerror = (err) => {
      console.warn('FileReader failed for compression, using original:', err);
      resolve(file);
    };
  });
};
