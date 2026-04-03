const { getPrayerTimesForDay, parseTimeToDate, addMinutes } = require('./utils');

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function generateBetweenPrayersIcsEvents(calendar, startName, endName, eventName, year = new Date().getFullYear()) {
    let events = [];
    const PRAYER_DURATION = 45;
    const startIndex = PRAYER_NAMES.findIndex(p => p.toLowerCase() === startName.toLowerCase());
    const endIndex = PRAYER_NAMES.findIndex(p => p.toLowerCase() === endName.toLowerCase());

    if (startIndex === -1 || endIndex === -1) return events;

    calendar.forEach((monthObj, monthIndex) => {
        const month = monthIndex + 1;
        const days = Object.keys(monthObj).sort((a, b) => Number(a) - Number(b));

        days.forEach(day => {
            const prayers = getPrayerTimesForDay(monthObj, day);
            if (!prayers) return;

            const startTimeStr = prayers[startIndex];
            const prayerStartDate = parseTimeToDate(year, month, day, startTimeStr);
            const startDate = addMinutes(prayerStartDate, PRAYER_DURATION);

            let endDate;
            if (startIndex < endIndex) {
                // Same day
                const endTimeStr = prayers[endIndex];
                endDate = parseTimeToDate(year, month, day, endTimeStr);
            } else {
                // Next day (e.g., Isha to Fajr)
                let nextEndTimeStr = null;
                const nextDayNum = Number(day) + 1;
                
                if (monthObj[nextDayNum]) {
                    const nextPrayers = getPrayerTimesForDay(monthObj, nextDayNum);
                    if (nextPrayers) nextEndTimeStr = nextPrayers[endIndex];
                } else if (calendar[monthIndex + 1]) {
                    const nextMonthPrayers = getPrayerTimesForDay(calendar[monthIndex + 1], 1);
                    if (nextMonthPrayers) nextEndTimeStr = nextMonthPrayers[endIndex];
                }

                if (!nextEndTimeStr) {
                    // Fallback to current day's time if next day not available (shouldn't happen for the last day of the year usually)
                    nextEndTimeStr = prayers[endIndex];
                }

                const nextDayDate = new Date(prayerStartDate);
                nextDayDate.setDate(nextDayDate.getDate() + 1);
                const [h, m] = nextEndTimeStr.split(':').map(Number);
                endDate = new Date(nextDayDate.getFullYear(), nextDayDate.getMonth(), nextDayDate.getDate(), h, m);
            }

            if (endDate > startDate) {
                const safeEventName = eventName.replace(/\s+/g, '_').toLowerCase();
                events.push({
                    uid: `${year}-${month}-${day}-${safeEventName}-${startName.toLowerCase()}-${endName.toLowerCase()}@between.local`,
                    start: startDate,
                    end: endDate,
                    summary: eventName,
                    description: `Always between ${PRAYER_NAMES[startIndex]} and ${PRAYER_NAMES[endIndex]}`
                });
            }
        });
    });

    return events;
}

module.exports = {
    generateBetweenPrayersIcsEvents
};
