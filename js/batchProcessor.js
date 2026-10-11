/**
 * ChronoStamp - Batch Processor Module
 * Asynchronously processes photos, renders stamps, and bundles into a downloadable ZIP.
 */

window.BatchProcessor = (function () {

    /**
     * Process all photos in photosList and export as ZIP archive.
     * @param {Array} photosList - Array of photo objects { file, name, dateObj, element }
     * @param {Object} styleOptions - Current UI styling options
     * @param {string} dateFormat - Date format pattern
     * @param {Function} onProgress - Callback (processedCount, totalCount)
     * @returns {Promise<Blob>} ZIP blob
     */
    async function createBatchZip(photosList, styleOptions, dateFormat, onProgress) {
        if (!photosList || photosList.length === 0) {
            throw new Error('No photos to process.');
        }

        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip library is missing.');
        }

        const zip = new JSZip();
        const total = photosList.length;

        // Hidden processing canvas
        const tempCanvas = document.createElement('canvas');

        for (let i = 0; i < total; i++) {
            const photo = photosList[i];
            
            // Format timestamp for this photo
            const stampText = window.TimestampEngine.formatDateTime(photo.dateObj, dateFormat);

            // Ensure HTMLImageElement is loaded
            const img = await loadImageElement(photo.file);

            // Render stamp onto hidden canvas
            const renderOptions = styleOptions.autoCropByOrientation
                ? {
                    ...styleOptions,
                    cropAmountPercent: getDefaultCropPercent(img)
                }
                : styleOptions;
            window.CanvasRenderer.renderStamp(tempCanvas, img, stampText, renderOptions);

            // Export to JPEG blob
            const blob = await window.CanvasRenderer.exportCanvasBlob(tempCanvas, 'image/jpeg', 0.92);

            // Keep the original filename exactly as-is
            zip.file(photo.name, blob);

            // Revoke image element src object to free browser RAM
            if (img.src.startsWith('blob:')) {
                URL.revokeObjectURL(img.src);
            }

            if (typeof onProgress === 'function') {
                onProgress(i + 1, total);
            }
        }

        // Generate ZIP file
        const zipBlob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        return zipBlob;
    }

    /**
     * Load a File object into an HTMLImageElement asynchronously
     */
    function loadImageElement(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                resolve(img);
            };
            img.onerror = (err) => {
                URL.revokeObjectURL(url);
                reject(err);
            };
            img.src = url;
        });
    }

    function getDefaultCropPercent(imageElement) {
        const width = imageElement.naturalWidth || imageElement.width;
        const height = imageElement.naturalHeight || imageElement.height;
        return height > width ? 6 : 10;
    }

    return {
        createBatchZip,
        loadImageElement
    };
})();
