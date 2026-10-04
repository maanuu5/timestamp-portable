/**
 * ChronoStamp - Timestamp Engine
 * Calculates linear time interpolation, fixed intervals, and formats date/time strings.
 */

window.TimestampEngine = (function () {

    /**
     * Parse date string (YYYY-MM-DD) and time string (HH:mm or HH:mm:ss) into a JS Date object.
     */
    function parseDateTime(dateStr, timeStr) {
        if (!dateStr) {
            // Default to today's date if empty
            const today = new Date();
            dateStr = today.toISOString().split('T')[0];
        }
        
        const [year, month, day] = dateStr.split('-').map(Number);
        const timeParts = (timeStr || '00:00:00').split(':').map(Number);
        const hours = timeParts[0] || 0;
        const minutes = timeParts[1] || 0;
        const seconds = timeParts[2] || 0;

        return new Date(year, month - 1, day, hours, minutes, seconds);
    }

    /**
     * Generate an array of Date objects interpolated across photoCount images.
     * @param {Object} params
     * @param {string} params.baseDate - "YYYY-MM-DD"
     * @param {string} params.startTime - "HH:mm" or "HH:mm:ss"
     * @param {string} params.endTime - "HH:mm" or "HH:mm:ss"
     * @param {number} params.photoCount - Total number of photos
     * @param {string} params.mode - "linear" or "step"
     * @param {number} params.stepSeconds - Used if mode === "step"
     * @returns {Date[]} Array of Date objects for each photo
     */
    function calculateTimestamps(params) {
        const {
            baseDate,
            startTime,
            endTime,
            photoCount,
            mode = 'step',
            stepSeconds = 30,
            jitterSeconds = 0
        } = params;
        
        if (photoCount <= 0) return [];

        const startDate = parseDateTime(baseDate, startTime);
        const endDate = parseDateTime(baseDate, endTime);

        // If start time is after end time (linear mode), handle date wrap
        let totalDurationMs = endDate.getTime() - startDate.getTime();
        if (totalDurationMs < 0) {
            endDate.setDate(endDate.getDate() + 1);
            totalDurationMs = endDate.getTime() - startDate.getTime();
        }

        const dates = [];

        if (photoCount === 1) {
            dates.push(new Date(startDate));
            return dates;
        }

        if (mode === 'linear') {
            const stepMs = totalDurationMs / (photoCount - 1);
            for (let i = 0; i < photoCount; i++) {
                const imgTimeMs = startDate.getTime() + (i * stepMs);
                dates.push(new Date(imgTimeMs));
            }
        } else if (mode === 'step') {
            const stepMs = stepSeconds * 1000;
            for (let i = 0; i < photoCount; i++) {
                const imgTimeMs = startDate.getTime() + (i * stepMs);
                dates.push(new Date(imgTimeMs));
            }
        } else if (mode === 'random') {
            let currentTimeMs = startDate.getTime();
            dates.push(new Date(currentTimeMs));
            const baseStepMs = stepSeconds * 1000;
            const maxJitterMs = (jitterSeconds || 5) * 1000;

            for (let i = 1; i < photoCount; i++) {
                // Pseudo-random deterministic or natural offset per photo
                const randomFactor = (Math.sin(i * 12.9898 + 78.233) + 1) / 2; // pseudo-random 0..1
                const randomOffsetMs = (randomFactor * 2 - 1) * maxJitterMs;
                const nextStepMs = Math.max(1000, baseStepMs + randomOffsetMs);
                currentTimeMs += nextStepMs;
                dates.push(new Date(currentTimeMs));
            }
        }

        return dates;
    }

    /**
     * Format a Date object into a target format string.
     * Supported formats:
     * - "DD/MM/YYYY HH:mm" (Exact match for reference image: 30/07/2026 10:44)
     * - "DD/MM/YYYY HH:mm:ss"
     * - "YYYY-MM-DD HH:mm"
     * - "MM/DD/YYYY hh:mm A"
     * - "DD MMM YYYY HH:mm"
     * - "HH:mm"
     */
    function formatDateTime(dateObj, formatPattern) {
        if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
            return '';
        }

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();

        const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthShort = monthNamesShort[dateObj.getMonth()];

        const hours24 = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');
        const seconds = String(dateObj.getSeconds()).padStart(2, '0');

        let hours12Num = dateObj.getHours() % 12;
        if (hours12Num === 0) hours12Num = 12;
        const hours12 = String(hours12Num).padStart(2, '0');
        const ampm = dateObj.getHours() >= 12 ? 'PM' : 'AM';

        switch (formatPattern) {
            case 'DD/MM/YYYY HH:mm':
                return `${day}/${month}/${year} ${hours24}:${minutes}`;
            case 'DD/MM/YYYY HH:mm:ss':
                return `${day}/${month}/${year} ${hours24}:${minutes}:${seconds}`;
            case 'YYYY-MM-DD HH:mm':
                return `${year}-${month}-${day} ${hours24}:${minutes}`;
            case 'MM/DD/YYYY hh:mm A':
                return `${month}/${day}/${year} ${hours12}:${minutes} ${ampm}`;
            case 'DD MMM YYYY HH:mm':
                return `${day} ${monthShort} ${year} ${hours24}:${minutes}`;
            case 'HH:mm':
                return `${hours24}:${minutes}`;
            default:
                return `${day}/${month}/${year} ${hours24}:${minutes}`;
        }
    }

    /**
     * Get summary text for duration and step interval
     */
    function getSummaryStats(params) {
        const { baseDate, startTime, endTime, photoCount, mode = 'step', stepSeconds = 30 } = params;
        const startDate = parseDateTime(baseDate, startTime);
        
        let durationStr = '--';
        let intervalStr = '--';

        if (photoCount <= 0) {
            if (stepSeconds >= 60) {
                const mins = (stepSeconds / 60).toFixed(1);
                intervalStr = `${mins} min / photo`;
            } else {
                intervalStr = `${stepSeconds}s / photo`;
            }
            return { durationText: '--', intervalText: intervalStr };
        }

        if (mode === 'linear') {
            const endDate = parseDateTime(baseDate, endTime);
            let diffMs = endDate.getTime() - startDate.getTime();
            if (diffMs < 0) diffMs += 24 * 3600 * 1000;
            const totalSeconds = Math.floor(diffMs / 1000);
            const totalMinutes = Math.floor(totalSeconds / 60);

            durationStr = totalMinutes >= 60 
                ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m` 
                : `${totalMinutes} mins`;

            if (photoCount > 1) {
                const secPerPhoto = totalSeconds / (photoCount - 1);
                intervalStr = secPerPhoto >= 60 
                    ? `~${(secPerPhoto / 60).toFixed(1)} m/photo` 
                    : `~${secPerPhoto.toFixed(1)}s/photo`;
            }
        } else {
            // Step or Random mode
            const totalSeconds = stepSeconds * Math.max(0, photoCount - 1);
            const totalMinutes = Math.floor(totalSeconds / 60);

            if (totalMinutes >= 60) {
                const hrs = Math.floor(totalMinutes / 60);
                const mins = totalMinutes % 60;
                durationStr = `${hrs}h ${mins}m`;
            } else if (totalMinutes > 0) {
                durationStr = `${totalMinutes} mins`;
            } else {
                durationStr = `${totalSeconds} secs`;
            }

            if (stepSeconds >= 60) {
                const mins = (stepSeconds / 60).toFixed(stepSeconds % 60 === 0 ? 0 : 1);
                intervalStr = `${mins}m / photo`;
            } else {
                intervalStr = `${stepSeconds}s / photo`;
            }
        }

        return {
            durationText: durationStr,
            intervalText: intervalStr
        };
    }

    return {
        calculateTimestamps,
        formatDateTime,
        getSummaryStats
    };
})();
