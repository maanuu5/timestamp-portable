/**
 * ChronoStamp - Main Application Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    const state = {
        photos: [], // Array of { id, file, name, dateObj, imageElement }
        currentIndex: 0,
        mode: 'pre-stamped', // 'pre-stamped' or 'bare'
        options: {
            baseDate: '',
            startTime: '08:31:00',
            endTime: '08:50:00',
            interpolationMode: 'step', // 'step', 'linear', 'random'
            stepValue: 30,
            stepUnit: 'seconds',
            stepSeconds: 30,
            jitterSeconds: 5,
            fontFamily: 'Inter, sans-serif',
            dateFormat: 'DD/MM/YYYY HH:mm',
            fontSizePercent: 2.8,
            textColor: '#ffffff',
            textOpacity: 0.95,
            enableShadow: true,
            enableOutline: true,
            position: 'bottom-right',
            paddingPercent: 3.5,
            // Prebuilt Stamp Crop Options
            enableCrop: true,
            cropMode: 'trim', // 'trim' or 'mask'
            cropEdge: 'bottom',
            cropAmountPercent: 6.0,
            maskColor: '#000000',
            // Watermark Options
            enableWatermark: true,
            watermarkImage: null,
            watermarkSizePercent: 8,
            watermarkOpacity: 0.95,
            watermarkOffsetY: 0
        }
    };

    // --- DOM Elements ---
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const selectFilesBtn = document.getElementById('selectFilesBtn');
    const addMoreFilesBtn = document.getElementById('addMoreFilesBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const exportZipBtn = document.getElementById('exportZipBtn');

    // Header Mode Switcher
    const switchModeBtn = document.getElementById('switchModeBtn');
    const modeBadgeText = document.getElementById('modeBadgeText');

    // Mode Selection Modal
    const modeSelectModal = document.getElementById('modeSelectModal');
    const modePreStampedCard = document.getElementById('modePreStampedCard');
    const selectPreStampedBtn = document.getElementById('selectPreStampedBtn');
    const modeBareCard = document.getElementById('modeBareCard');
    const selectBareBtn = document.getElementById('selectBareBtn');

    // Prebuilt Stamp Removal Controls
    const cropPanelSection = document.getElementById('cropPanelSection');
    const cropStatusBadge = document.getElementById('cropStatusBadge');
    const cropModeSelect = document.getElementById('cropMode');
    const cropEdgeSelect = document.getElementById('cropEdge');
    const cropPresetButtons = document.querySelectorAll('#cropPresetGroup .preset-btn');
    const cropAmountPercentInput = document.getElementById('cropAmountPercent');
    const cropAmountVal = document.getElementById('cropAmountVal');
    const maskColorGroup = document.getElementById('maskColorGroup');
    const maskColorInput = document.getElementById('maskColor');
    const maskColorHex = document.getElementById('maskColorHex');

    const previewContainer = document.getElementById('previewContainer');
    const previewCanvas = document.getElementById('previewCanvas');
    const currentImageName = document.getElementById('currentImageName');
    const currentImageIndex = document.getElementById('currentImageIndex');
    const currentImageDimensions = document.getElementById('currentImageDimensions');
    const prevPhotoBtn = document.getElementById('prevPhotoBtn');
    const nextPhotoBtn = document.getElementById('nextPhotoBtn');
    const downloadCurrentBtn = document.getElementById('downloadCurrentBtn');

    const thumbnailStripContainer = document.getElementById('thumbnailStripContainer');
    const thumbnailStrip = document.getElementById('thumbnailStrip');
    const thumbCount = document.getElementById('thumbCount');
    const photoCountBadge = document.getElementById('photoCountBadge');
    const sortByFilenameBtn = document.getElementById('sortByFilenameBtn');
    const photoTimePicker = document.getElementById('photoTimePicker');

    // Time & Interval Controls
    const baseDateInput = document.getElementById('baseDate');
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const endTimeGroup = document.getElementById('endTimeGroup');
    const totalDurationText = document.getElementById('totalDurationText');
    const intervalPerPhotoText = document.getElementById('intervalPerPhotoText');
    const interpolationModeSelect = document.getElementById('interpolationMode');
    const intervalControlGroup = document.getElementById('intervalControlGroup');
    const intervalPresetButtons = document.querySelectorAll('#intervalPresetGroup .preset-btn');
    const stepValueInput = document.getElementById('stepValue');
    const stepUnitSelect = document.getElementById('stepUnit');
    const jitterGroup = document.getElementById('jitterGroup');
    const jitterSecondsInput = document.getElementById('jitterSeconds');

    const fontFamilySelect = document.getElementById('fontFamily');
    const dateFormatSelect = document.getElementById('dateFormat');
    const fontSizePercentInput = document.getElementById('fontSizePercent');
    const fontSizeVal = document.getElementById('fontSizeVal');
    const textColorInput = document.getElementById('textColor');
    const textColorHex = document.getElementById('textColorHex');
    const textOpacityInput = document.getElementById('textOpacity');
    const enableShadowInput = document.getElementById('enableShadow');
    const enableOutlineInput = document.getElementById('enableOutline');
    const posButtons = document.querySelectorAll('.pos-btn');
    const paddingPercentInput = document.getElementById('paddingPercent');
    const enableWatermarkInput = document.getElementById('enableWatermark');
    const watermarkStatusBadge = document.getElementById('watermarkStatusBadge');
    const watermarkControlsContainer = document.getElementById('watermarkControlsContainer');
    const watermarkDropdown = document.getElementById('watermarkDropdown');
    const watermarkDropdownTrigger = document.getElementById('watermarkDropdownTrigger');
    const currentWatermarkThumb = document.getElementById('currentWatermarkThumb');
    const currentWatermarkName = document.getElementById('currentWatermarkName');
    const watermarkDropdownArrow = document.getElementById('watermarkDropdownArrow');
    const watermarkDropdownMenu = document.getElementById('watermarkDropdownMenu');
    const watermarkOptionsList = document.getElementById('watermarkOptionsList');
    const uploadWatermarkBtn = document.getElementById('uploadWatermarkBtn');
    const watermarkFileInput = document.getElementById('watermarkFileInput');
    const watermarkSizePercentInput = document.getElementById('watermarkSizePercent');
    const watermarkSizeVal = document.getElementById('watermarkSizeVal');
    const watermarkOpacityInput = document.getElementById('watermarkOpacity');
    const watermarkOffsetYInput = document.getElementById('watermarkOffsetY');
    const watermarkOffsetYVal = document.getElementById('watermarkOffsetYVal');

    // Export Modal
    const exportModal = document.getElementById('exportModal');
    const exportProgressBar = document.getElementById('exportProgressBar');
    const exportProgressText = document.getElementById('exportProgressText');

    // Watermark Management System
    const watermarkManager = {
        watermarks: [
            {
                id: 'default',
                name: 'Default Watermark',
                src: 'watermark/watermark.png',
                isDefault: true,
                imageElement: null
            }
        ],
        selectedId: 'default',

        init() {
            // Load default image
            const defImg = new Image();
            defImg.onload = () => {
                if (state.photos.length > 0) {
                    renderCurrentPreview();
                }
            };
            defImg.src = 'watermark/watermark.png';
            this.watermarks[0].imageElement = defImg;
            state.options.watermarkImage = defImg;

            // Load saved custom watermarks from localStorage
            try {
                const saved = localStorage.getItem('custom_watermarks');
                if (saved) {
                    const list = JSON.parse(saved);
                    list.forEach(item => {
                        const img = new Image();
                        img.src = item.src;
                        this.watermarks.push({
                            id: item.id,
                            name: item.name,
                            src: item.src,
                            isDefault: false,
                            imageElement: img
                        });
                    });
                }
                const savedId = localStorage.getItem('selected_watermark_id');
                if (savedId && this.watermarks.some(w => w.id === savedId)) {
                    this.selectWatermark(savedId, false);
                }
            } catch (err) {
                console.warn('Failed to load saved watermarks', err);
            }

            this.renderUI();
            this.bindEvents();
        },

        selectWatermark(id, shouldRender = true) {
            const wm = this.watermarks.find(w => w.id === id);
            if (!wm) return;

            this.selectedId = id;
            state.options.watermarkImage = wm.imageElement;

            try {
                localStorage.setItem('selected_watermark_id', id);
            } catch (e) {}

            this.renderUI();
            if (shouldRender) {
                renderCurrentPreview();
            }
        },

        renderUI() {
            const current = this.watermarks.find(w => w.id === this.selectedId) || this.watermarks[0];
            if (currentWatermarkThumb) currentWatermarkThumb.src = current.src;
            if (currentWatermarkName) currentWatermarkName.textContent = current.name;

            if (!watermarkOptionsList) return;
            watermarkOptionsList.innerHTML = '';

            this.watermarks.forEach(item => {
                const isSelected = item.id === this.selectedId;
                const row = document.createElement('div');
                row.className = `watermark-option-item ${isSelected ? 'active' : ''}`;
                row.dataset.id = item.id;

                row.innerHTML = `
                    <div class="watermark-option-thumb">
                        <img src="${item.src}" alt="${item.name}">
                    </div>
                    <div class="watermark-option-info">
                        <div class="watermark-option-name" title="${item.name}">${item.name}</div>
                        <div class="watermark-option-tag">${item.isDefault ? 'Built-in' : 'Custom Upload'}</div>
                    </div>
                    <i class="fa-solid fa-check watermark-option-check"></i>
                    ${!item.isDefault ? `<button type="button" class="watermark-option-delete" title="Delete watermark"><i class="fa-solid fa-trash-can"></i></button>` : ''}
                `;

                // Select on row click (excluding delete button)
                row.addEventListener('click', (e) => {
                    const delBtn = e.target.closest('.watermark-option-delete');
                    if (delBtn) return;
                    this.selectWatermark(item.id);
                    this.closeDropdown();
                });

                // Delete custom watermark
                const deleteBtn = row.querySelector('.watermark-option-delete');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.deleteWatermark(item.id);
                    });
                }

                watermarkOptionsList.appendChild(row);
            });
        },

        deleteWatermark(id) {
            const idx = this.watermarks.findIndex(w => w.id === id);
            if (idx === -1) return;

            this.watermarks.splice(idx, 1);
            if (this.selectedId === id) {
                this.selectWatermark('default', true);
            }

            try {
                const toSave = this.watermarks.filter(w => !w.isDefault).map(w => ({
                    id: w.id,
                    name: w.name,
                    src: w.src
                }));
                localStorage.setItem('custom_watermarks', JSON.stringify(toSave));
            } catch (e) {}

            this.renderUI();
        },

        toggleDropdown() {
            if (!watermarkDropdownMenu) return;
            const isOpen = !watermarkDropdownMenu.classList.contains('hidden');
            if (isOpen) {
                this.closeDropdown();
            } else {
                this.openDropdown();
            }
        },

        openDropdown() {
            if (!watermarkDropdownMenu) return;
            watermarkDropdownMenu.classList.remove('hidden');
            if (watermarkDropdownTrigger) watermarkDropdownTrigger.classList.add('open');
        },

        closeDropdown() {
            if (!watermarkDropdownMenu) return;
            watermarkDropdownMenu.classList.add('hidden');
            if (watermarkDropdownTrigger) watermarkDropdownTrigger.classList.remove('open');
        },

        bindEvents() {
            if (watermarkDropdownTrigger) {
                watermarkDropdownTrigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.toggleDropdown();
                });
            }

            // Close on click outside
            document.addEventListener('click', (e) => {
                if (watermarkDropdown && !watermarkDropdown.contains(e.target)) {
                    this.closeDropdown();
                }
            });

            // Upload button
            if (uploadWatermarkBtn && watermarkFileInput) {
                uploadWatermarkBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    watermarkFileInput.click();
                });

                watermarkFileInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        if (!file.type.startsWith('image/')) {
                            alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
                            return;
                        }

                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const dataUrl = event.target.result;
                            const img = new Image();
                            img.onload = () => {
                                const newId = 'wm_' + Date.now();
                                const newWm = {
                                    id: newId,
                                    name: file.name,
                                    src: dataUrl,
                                    isDefault: false,
                                    imageElement: img
                                };
                                this.watermarks.push(newWm);
                                this.selectWatermark(newId);
                                this.closeDropdown();

                                try {
                                    const toSave = this.watermarks.filter(w => !w.isDefault).map(w => ({
                                        id: w.id,
                                        name: w.name,
                                        src: w.src
                                    }));
                                    localStorage.setItem('custom_watermarks', JSON.stringify(toSave));
                                } catch (storageErr) {
                                    console.warn('Could not cache custom watermark in localStorage', storageErr);
                                }
                            };
                            img.src = dataUrl;
                        };
                        reader.readAsDataURL(file);
                        watermarkFileInput.value = '';
                    }
                });
            }
        }
    };

    // --- Initialization ---
    init();

    function init() {
        // Set today's date in date picker if empty
        const today = new Date().toISOString().split('T')[0];
        baseDateInput.value = today;
        state.options.baseDate = today;

        bindEvents();
        watermarkManager.init();
        updateTimeStatsUI();

        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                if (state.photos.length > 0) {
                    renderCurrentPreview();
                }
            });
        }

        // Prompt user with Mode Selection Modal on start
        modeSelectModal.classList.remove('hidden');
    }

    function setPhotoMode(mode) {
        state.mode = mode;
        if (mode === 'pre-stamped') {
            state.options.enableCrop = true;
            modeBadgeText.textContent = 'Mode: Replace Old Stamp';
            cropStatusBadge.textContent = 'Active';
            cropStatusBadge.classList.remove('off');
            cropPanelSection.classList.remove('hidden');
        } else {
            state.options.enableCrop = false;
            modeBadgeText.textContent = 'Mode: Clean Photos';
            cropStatusBadge.textContent = 'Disabled';
            cropStatusBadge.classList.add('off');
            cropPanelSection.classList.add('hidden');
        }
        modeSelectModal.classList.add('hidden');
        renderCurrentPreview();
    }

    function bindEvents() {
        // Mode switch triggers
        switchModeBtn.addEventListener('click', () => {
            modeSelectModal.classList.remove('hidden');
        });

        selectPreStampedBtn.addEventListener('click', () => setPhotoMode('pre-stamped'));
        modePreStampedCard.addEventListener('click', (e) => {
            if (e.target !== selectPreStampedBtn && !selectPreStampedBtn.contains(e.target)) {
                setPhotoMode('pre-stamped');
            }
        });

        selectBareBtn.addEventListener('click', () => setPhotoMode('bare'));
        modeBareCard.addEventListener('click', (e) => {
            if (e.target !== selectBareBtn && !selectBareBtn.contains(e.target)) {
                setPhotoMode('bare');
            }
        });

        // Prebuilt Stamp Removal Controls
        cropModeSelect.addEventListener('change', (e) => {
            state.options.cropMode = e.target.value;
            if (e.target.value === 'mask') {
                maskColorGroup.classList.remove('hidden');
            } else {
                maskColorGroup.classList.add('hidden');
            }
            renderCurrentPreview();
        });

        cropEdgeSelect.addEventListener('change', (e) => {
            state.options.cropEdge = e.target.value;
            renderCurrentPreview();
        });

        cropAmountPercentInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            state.options.cropAmountPercent = val;
            cropAmountVal.textContent = `${val.toFixed(1)}%`;
            renderCurrentPreview();
        });

        cropPresetButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                cropPresetButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const val = parseFloat(btn.dataset.crop);
                state.options.cropAmountPercent = val;
                cropAmountPercentInput.value = val;
                cropAmountVal.textContent = `${val.toFixed(1)}%`;
                renderCurrentPreview();
            });
        });

        maskColorInput.addEventListener('input', (e) => {
            state.options.maskColor = e.target.value;
            maskColorHex.textContent = e.target.value.toUpperCase();
            renderCurrentPreview();
        });

        // Drag & Drop
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.querySelector('.dropzone-card').classList.add('drag-over');
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.querySelector('.dropzone-card').classList.remove('drag-over');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.querySelector('.dropzone-card').classList.remove('drag-over');
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileSelection(Array.from(e.dataTransfer.files));
            }
        });

        selectFilesBtn.addEventListener('click', () => fileInput.click());
        addMoreFilesBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                handleFileSelection(Array.from(e.target.files));
                fileInput.value = ''; // Reset input
            }
        });

        clearAllBtn.addEventListener('click', handleClearAll);

        // Time & Interval Calculation Event Listeners
        baseDateInput.addEventListener('change', (e) => {
            state.options.baseDate = e.target.value;
            recalculateTimestamps();
        });

        startTimeInput.addEventListener('change', (e) => {
            state.options.startTime = e.target.value;
            recalculateTimestamps();
        });

        endTimeInput.addEventListener('change', (e) => {
            state.options.endTime = e.target.value;
            recalculateTimestamps();
        });

        interpolationModeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            state.options.interpolationMode = mode;
            
            if (mode === 'linear') {
                endTimeGroup.classList.remove('hidden');
                intervalControlGroup.classList.add('hidden');
            } else if (mode === 'step') {
                endTimeGroup.classList.add('hidden');
                intervalControlGroup.classList.remove('hidden');
                jitterGroup.classList.add('hidden');
            } else if (mode === 'random') {
                endTimeGroup.classList.add('hidden');
                intervalControlGroup.classList.remove('hidden');
                jitterGroup.classList.remove('hidden');
            }
            recalculateTimestamps();
        });

        intervalPresetButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                intervalPresetButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const totalSec = parseInt(btn.dataset.sec, 10);
                if (totalSec >= 60) {
                    const mins = totalSec / 60;
                    stepValueInput.value = mins;
                    stepUnitSelect.value = 'minutes';
                    state.options.stepValue = mins;
                    state.options.stepUnit = 'minutes';
                } else {
                    stepValueInput.value = totalSec;
                    stepUnitSelect.value = 'seconds';
                    state.options.stepValue = totalSec;
                    state.options.stepUnit = 'seconds';
                }
                state.options.stepSeconds = totalSec;
                recalculateTimestamps();
            });
        });

        stepValueInput.addEventListener('input', (e) => {
            const val = Math.max(1, parseFloat(e.target.value) || 1);
            state.options.stepValue = val;
            state.options.stepSeconds = getCalculatedStepSeconds();
            recalculateTimestamps();
        });

        stepUnitSelect.addEventListener('change', (e) => {
            state.options.stepUnit = e.target.value;
            state.options.stepSeconds = getCalculatedStepSeconds();
            recalculateTimestamps();
        });

        jitterSecondsInput.addEventListener('input', (e) => {
            state.options.jitterSeconds = Math.max(0, parseFloat(e.target.value) || 0);
            recalculateTimestamps();
        });

        // Per-Photo Timestamp Manual Override
        if (photoTimePicker) {
            photoTimePicker.addEventListener('change', (e) => {
                if (state.photos.length === 0) return;
                const currentPhoto = state.photos[state.currentIndex];
                if (!currentPhoto || !e.target.value) return;

                const parts = e.target.value.split(':').map(Number);
                const hrs = parts[0] || 0;
                const mins = parts[1] || 0;
                const secs = parts[2] || 0;

                const d = new Date(currentPhoto.dateObj);
                d.setHours(hrs, mins, secs);
                currentPhoto.dateObj = d;

                renderCurrentPreview();
                renderThumbnails();
            });
        }

        // Styling Controls
        fontFamilySelect.addEventListener('change', (e) => {
            state.options.fontFamily = e.target.value;
            renderCurrentPreview();
        });

        dateFormatSelect.addEventListener('change', (e) => {
            state.options.dateFormat = e.target.value;
            renderCurrentPreview();
            renderThumbnails();
        });

        fontSizePercentInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            state.options.fontSizePercent = val;
            fontSizeVal.textContent = `${val}%`;
            renderCurrentPreview();
        });

        textColorInput.addEventListener('input', (e) => {
            state.options.textColor = e.target.value;
            textColorHex.textContent = e.target.value.toUpperCase();
            renderCurrentPreview();
        });

        textOpacityInput.addEventListener('input', (e) => {
            state.options.textOpacity = parseFloat(e.target.value);
            renderCurrentPreview();
        });

        enableShadowInput.addEventListener('change', (e) => {
            state.options.enableShadow = e.target.checked;
            renderCurrentPreview();
        });

        enableOutlineInput.addEventListener('change', (e) => {
            state.options.enableOutline = e.target.checked;
            renderCurrentPreview();
        });

        paddingPercentInput.addEventListener('input', (e) => {
            state.options.paddingPercent = parseFloat(e.target.value);
            renderCurrentPreview();
        });

        // Watermark Controls
        if (enableWatermarkInput) {
            enableWatermarkInput.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                state.options.enableWatermark = isChecked;
                if (watermarkStatusBadge) {
                    watermarkStatusBadge.textContent = isChecked ? 'Active' : 'Off';
                    if (isChecked) {
                        watermarkStatusBadge.classList.remove('off');
                    } else {
                        watermarkStatusBadge.classList.add('off');
                    }
                }
                if (watermarkControlsContainer) {
                    watermarkControlsContainer.classList.toggle('disabled-group', !isChecked);
                }
                renderCurrentPreview();
            });
        }

        watermarkSizePercentInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            state.options.watermarkSizePercent = val;
            watermarkSizeVal.textContent = `${val.toFixed(1)}%`;
            renderCurrentPreview();
        });

        watermarkOpacityInput.addEventListener('input', (e) => {
            state.options.watermarkOpacity = parseFloat(e.target.value);
            renderCurrentPreview();
        });

        watermarkOffsetYInput.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            state.options.watermarkOffsetY = val;
            watermarkOffsetYVal.textContent = (val >= 0 ? '+' : '') + val.toFixed(1) + '%';
            renderCurrentPreview();
        });

        posButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                posButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                state.options.position = btn.dataset.pos;
                renderCurrentPreview();
            });
        });

        // Navigation
        prevPhotoBtn.addEventListener('click', () => {
            if (state.currentIndex > 0) {
                state.currentIndex--;
                renderCurrentPreview();
                updateThumbnailActiveState();
            }
        });

        nextPhotoBtn.addEventListener('click', () => {
            if (state.currentIndex < state.photos.length - 1) {
                state.currentIndex++;
                renderCurrentPreview();
                updateThumbnailActiveState();
            }
        });

        sortByFilenameBtn.addEventListener('click', () => {
            state.photos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            recalculateTimestamps();
        });

        // Download Actions
        downloadCurrentBtn.addEventListener('click', handleDownloadCurrent);
        exportZipBtn.addEventListener('click', handleExportZip);
    }

    /**
     * Ingest newly uploaded files
     */
    async function handleFileSelection(files) {
        // Filter only images
        const imageFiles = files.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length === 0) return;

        for (const file of imageFiles) {
            try {
                const imageElement = await window.BatchProcessor.loadImageElement(file);
                state.photos.push({
                    id: Math.random().toString(36).substring(2, 9),
                    file,
                    name: file.name,
                    dateObj: new Date(),
                    imageElement
                });
            } catch (err) {
                console.error(`Failed to load image ${file.name}:`, err);
            }
        }

        if (state.photos.length > 0) {
            dropzone.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            thumbnailStripContainer.classList.remove('hidden');

            addMoreFilesBtn.disabled = false;
            clearAllBtn.disabled = false;
            exportZipBtn.disabled = false;

            recalculateTimestamps();
        }
    }

    /**
     * Calculate step interval in seconds from value & unit
     */
    function getCalculatedStepSeconds() {
        const val = parseFloat(state.options.stepValue) || 30;
        const unit = state.options.stepUnit;
        if (unit === 'minutes') return Math.round(val * 60);
        if (unit === 'hours') return Math.round(val * 3600);
        return Math.round(val);
    }

    /**
     * Recalculate timestamps for all photos using TimestampEngine
     */
    function recalculateTimestamps() {
        const count = state.photos.length;
        photoCountBadge.innerHTML = `${count} Photos`;
        thumbCount.textContent = count;

        state.options.stepSeconds = getCalculatedStepSeconds();
        updateTimeStatsUI();

        if (count === 0) return;

        const dates = window.TimestampEngine.calculateTimestamps({
            baseDate: state.options.baseDate,
            startTime: state.options.startTime,
            endTime: state.options.endTime,
            photoCount: count,
            mode: state.options.interpolationMode,
            stepSeconds: state.options.stepSeconds,
            jitterSeconds: state.options.jitterSeconds
        });

        // Assign dates to photo state
        state.photos.forEach((photo, idx) => {
            photo.dateObj = dates[idx] || new Date();
        });

        renderThumbnails();
        renderCurrentPreview();
    }

    function updateTimeStatsUI() {
        state.options.stepSeconds = getCalculatedStepSeconds();

        const stats = window.TimestampEngine.getSummaryStats({
            baseDate: state.options.baseDate,
            startTime: state.options.startTime,
            endTime: state.options.endTime,
            photoCount: state.photos.length,
            mode: state.options.interpolationMode,
            stepSeconds: state.options.stepSeconds
        });

        totalDurationText.textContent = stats.durationText;
        intervalPerPhotoText.textContent = stats.intervalText;
    }

    /**
     * Render main preview canvas
     */
    function renderCurrentPreview() {
        if (state.photos.length === 0) return;

        const currentPhoto = state.photos[state.currentIndex];
        if (!currentPhoto) return;

        currentImageName.textContent = currentPhoto.name;
        currentImageIndex.textContent = `${state.currentIndex + 1} of ${state.photos.length}`;
        
        // Update per-photo time picker input
        if (photoTimePicker && currentPhoto.dateObj) {
            const hh = String(currentPhoto.dateObj.getHours()).padStart(2, '0');
            const mm = String(currentPhoto.dateObj.getMinutes()).padStart(2, '0');
            const ss = String(currentPhoto.dateObj.getSeconds()).padStart(2, '0');
            photoTimePicker.value = `${hh}:${mm}:${ss}`;
        }

        // Format stamp text
        const stampText = window.TimestampEngine.formatDateTime(currentPhoto.dateObj, state.options.dateFormat);

        // Draw canvas
        window.CanvasRenderer.renderStamp(previewCanvas, currentPhoto.imageElement, stampText, state.options);

        // Update dimension badge after rendering canvas
        const finalW = previewCanvas.width;
        const finalH = previewCanvas.height;
        const origW = currentPhoto.imageElement.naturalWidth || currentPhoto.imageElement.width;
        const origH = currentPhoto.imageElement.naturalHeight || currentPhoto.imageElement.height;
        
        if (state.options.enableCrop && state.options.cropMode === 'trim' && (finalW !== origW || finalH !== origH)) {
            currentImageDimensions.textContent = `${finalW}x${finalH}px (Cropped from ${origW}x${origH})`;
        } else {
            currentImageDimensions.textContent = `${finalW}x${finalH}px`;
        }

        // Update nav buttons
        prevPhotoBtn.disabled = state.currentIndex === 0;
        nextPhotoBtn.disabled = state.currentIndex === state.photos.length - 1;
    }

    /**
     * Render bottom thumbnail bar
     */
    function renderThumbnails() {
        thumbnailStrip.innerHTML = '';

        state.photos.forEach((photo, idx) => {
            const card = document.createElement('div');
            card.className = `thumb-card ${idx === state.currentIndex ? 'active' : ''}`;
            card.dataset.index = idx;

            const timeStr = window.TimestampEngine.formatDateTime(photo.dateObj, 'HH:mm');

            card.innerHTML = `
                <img src="${photo.imageElement.src}" class="thumb-img" alt="${photo.name}">
                <div class="thumb-time-badge">${timeStr}</div>
            `;

            card.addEventListener('click', () => {
                state.currentIndex = idx;
                renderCurrentPreview();
                updateThumbnailActiveState();
            });

            thumbnailStrip.appendChild(card);
        });

        updateThumbnailActiveState();
    }

    function updateThumbnailActiveState() {
        const cards = thumbnailStrip.querySelectorAll('.thumb-card');
        cards.forEach((card, idx) => {
            if (idx === state.currentIndex) {
                card.classList.add('active');
                card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                card.classList.remove('active');
            }
        });
    }

    /**
     * Download single current stamped image
     */
    async function handleDownloadCurrent() {
        if (state.photos.length === 0) return;
        const photo = state.photos[state.currentIndex];
        
        const blob = await window.CanvasRenderer.exportCanvasBlob(previewCanvas, 'image/jpeg', 0.95);
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = photo.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Bulk export all stamped images as ZIP archive
     */
    async function handleExportZip() {
        if (state.photos.length === 0) return;

        exportModal.classList.remove('hidden');
        exportProgressBar.style.width = '0%';
        exportProgressText.textContent = `Processing photo 1 of ${state.photos.length}...`;

        try {
            const zipBlob = await window.BatchProcessor.createBatchZip(
                state.photos,
                state.options,
                state.options.dateFormat,
                (processed, total) => {
                    const percent = Math.round((processed / total) * 100);
                    exportProgressBar.style.width = `${percent}%`;
                    exportProgressText.textContent = `Stamping photo ${processed} of ${total}...`;
                }
            );

            // Trigger ZIP download
            const zipUrl = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = zipUrl;
            a.download = `ChronoStamp_Batch_${state.photos.length}_photos.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(zipUrl);

        } catch (err) {
            alert(`Export failed: ${err.message}`);
            console.error(err);
        } finally {
            setTimeout(() => {
                exportModal.classList.add('hidden');
            }, 500);
        }
    }

    /**
     * Clear all loaded photos
     */
    function handleClearAll() {
        if (confirm('Are you sure you want to clear all loaded photos?')) {
            state.photos.forEach(p => {
                if (p.imageElement.src.startsWith('blob:')) {
                    URL.revokeObjectURL(p.imageElement.src);
                }
            });

            state.photos = [];
            state.currentIndex = 0;

            dropzone.classList.remove('hidden');
            previewContainer.classList.add('hidden');
            thumbnailStripContainer.classList.add('hidden');

            addMoreFilesBtn.disabled = true;
            clearAllBtn.disabled = true;
            exportZipBtn.disabled = true;

            photoCountBadge.innerHTML = `0 Photos`;
            updateTimeStatsUI();
        }
    }
});
