/**
 * ChronoStamp - Canvas Renderer Engine
 * Draws high-resolution images with crisp timestamp overlays.
 */

window.CanvasRenderer = (function () {

    // Watermark image (loaded once, cached)
    let watermarkImage = null;
    let watermarkReady = false;
    let lastRenderArgs = null;

    function initWatermark() {
        if (watermarkImage) return;
        watermarkImage = new Image();
        watermarkImage.onload = () => {
            watermarkReady = true;
            // Re-render last target once the watermark becomes available
            if (lastRenderArgs) {
                renderStamp(lastRenderArgs.canvas, lastRenderArgs.image, lastRenderArgs.timestampText, lastRenderArgs.styleOptions);
            }
        };
        watermarkImage.src = 'watermark/watermark.png';
    }
    initWatermark();

    /**
     * Render image and timestamp onto a canvas element.
     * @param {HTMLCanvasElement} canvas - Target canvas
     * @param {HTMLImageElement|ImageBitmap} image - Source image element
     * @param {string} timestampText - Text to overlay (e.g. "30/07/2026 10:44")
     * @param {Object} styleOptions - Options for font, position, colors, size
     */
    function renderStamp(canvas, image, timestampText, styleOptions) {
        if (!canvas || !image || !timestampText) return;

        lastRenderArgs = { canvas, image, timestampText, styleOptions };

        const {
            fontFamily = 'Inter, sans-serif',
            fontSizePercent = 2.8, // % of image height
            textColor = '#ffffff',
            textOpacity = 0.95,
            enableShadow = true,
            enableOutline = true,
            position = 'bottom-right',
            paddingPercent = 3.5, // % of image dimension
            // Crop / Prebuilt Stamp Removal Options
            enableCrop = true,
            cropMode = 'trim', // 'trim' (cut canvas) or 'mask' (fill region)
            cropEdge = 'bottom', // 'bottom', 'top', 'left', 'right'
            cropAmountPercent = 6.0,
            maskColor = '#000000',
            // Watermark Options
            enableWatermark = true,
            watermarkSizePercent = 8,
            watermarkOpacity = 0.95,
            watermarkOffsetY = 0
        } = styleOptions;

        const rawWidth = image.naturalWidth || image.width;
        const rawHeight = image.naturalHeight || image.height;

        if (rawWidth === 0 || rawHeight === 0) return;

        // Determine crop box and target canvas size
        let srcX = 0;
        let srcY = 0;
        let srcW = rawWidth;
        let srcH = rawHeight;
        let canvasW = rawWidth;
        let canvasH = rawHeight;

        let cropPx = 0;
        if (enableCrop && cropAmountPercent > 0) {
            if (cropEdge === 'bottom' || cropEdge === 'top') {
                cropPx = Math.round((rawHeight * cropAmountPercent) / 100);
                cropPx = Math.min(cropPx, rawHeight - 20); // Retain at least 20px
            } else {
                cropPx = Math.round((rawWidth * cropAmountPercent) / 100);
                cropPx = Math.min(cropPx, rawWidth - 20);
            }

            if (cropMode === 'trim') {
                switch (cropEdge) {
                    case 'bottom':
                        srcH = rawHeight - cropPx;
                        break;
                    case 'top':
                        srcY = cropPx;
                        srcH = rawHeight - cropPx;
                        break;
                    case 'left':
                        srcX = cropPx;
                        srcW = rawWidth - cropPx;
                        break;
                    case 'right':
                        srcW = rawWidth - cropPx;
                        break;
                }
                canvasW = srcW;
                canvasH = srcH;
            }
        }

        // Reset canvas dimensions to clear buffer & resize canvas to crop size
        canvas.width = canvasW;
        canvas.height = canvasH;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvasW, canvasH);

        // 1. Draw source image (Trimmed or Full)
        if (enableCrop && cropMode === 'trim') {
            ctx.drawImage(image, srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH);
        } else {
            ctx.drawImage(image, 0, 0, rawWidth, rawHeight);
            
            // Apply solid mask over specified edge if in mask mode
            if (enableCrop && cropMode === 'mask' && cropPx > 0) {
                ctx.fillStyle = maskColor;
                switch (cropEdge) {
                    case 'bottom':
                        ctx.fillRect(0, rawHeight - cropPx, rawWidth, cropPx);
                        break;
                    case 'top':
                        ctx.fillRect(0, 0, rawWidth, cropPx);
                        break;
                    case 'left':
                        ctx.fillRect(0, 0, cropPx, rawHeight);
                        break;
                    case 'right':
                        ctx.fillRect(rawWidth - cropPx, 0, cropPx, rawHeight);
                        break;
                }
            }
        }

        // 2. Save context state & draw new timestamp overlay
        ctx.save();

        // Dynamic font size based on target image height
        const fontSizePx = Math.max(12, Math.round((canvasH * fontSizePercent) / 100));

        ctx.font = `${fontSizePx}px ${fontFamily}`;
        ctx.globalAlpha = textOpacity;

        // Calculate padding in pixels relative to cropped canvas
        const padX = Math.round((canvasW * paddingPercent) / 100);
        const padY = Math.round((canvasH * paddingPercent) / 100);

        let x = 0;
        let y = 0;

        switch (position) {
            case 'top-left':
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                x = padX;
                y = padY;
                break;
            case 'top-right':
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                x = canvasW - padX;
                y = padY;
                break;
            case 'bottom-left':
                ctx.textAlign = 'left';
                ctx.textBaseline = 'bottom';
                x = padX;
                y = canvasH - padY;
                break;
            case 'bottom-right':
            default:
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                x = canvasW - padX;
                y = canvasH - padY;
                break;
        }

        // 3. Configure Shadow (centered glow, no offset duplication)
        if (enableShadow) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = Math.max(4, Math.round(fontSizePx * 0.25));
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }

        // 4. Draw Outline if enabled
        if (enableOutline) {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
            ctx.lineWidth = Math.max(2, Math.round(fontSizePx * 0.08));
            ctx.lineJoin = 'round';
            ctx.strokeText(timestampText, x, y);
        }

        // 5. Fill Text
        ctx.fillStyle = textColor;
        ctx.fillText(timestampText, x, y);

        ctx.restore();

        // 6. Draw watermark on the OPPOSITE horizontal side from the timestamp
        if (enableWatermark && watermarkReady && watermarkImage) {
            // Watermark height: configurable % of canvas height, maintain aspect ratio
            const wmH = Math.round(canvasH * (watermarkSizePercent / 100));
            const wmAspect = watermarkImage.naturalWidth / watermarkImage.naturalHeight;
            const wmW = Math.round(wmH * wmAspect);

            const isTop = position === 'top-left' || position === 'top-right';
            const isRight = position === 'bottom-right' || position === 'top-right';

            // Calculate the vertical CENTER of the text line so we can center the watermark on it.
            // For 'bottom' baseline: y is bottom of descenders, visual cap-center ≈ y - fontSizePx * 0.6
            // For 'top' baseline:    y is top of ascenders,  visual cap-center ≈ y + fontSizePx * 0.4
            const offsetPx = Math.round(canvasH * (watermarkOffsetY / 100));
            let textCenterY;
            if (isTop) {
                textCenterY = y + fontSizePx * 0.4;
            } else {
                textCenterY = y - fontSizePx * 0.6;
            }
            // Center the watermark vertically on that same line, then add manual nudge
            const wmY = Math.round(textCenterY - wmH / 2) + offsetPx;

            if (isRight) {
                // Timestamp is right → watermark goes left
                wmX = padX;
            } else {
                // Timestamp is left → watermark goes right
                wmX = canvasW - padX - wmW;
            }

            ctx.save();
            ctx.globalAlpha = watermarkOpacity;
            ctx.drawImage(watermarkImage, wmX, wmY, wmW, wmH);
            ctx.restore();
        }
    }

    /**
     * Export canvas contents as Blob (PNG or JPEG)
     */
    function exportCanvasBlob(canvas, mimeType = 'image/jpeg', quality = 0.92) {
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, mimeType, quality);
        });
    }

    return {
        renderStamp,
        exportCanvasBlob
    };
})();
