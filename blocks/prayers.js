const { addMinutes, getPrayerTimesForDay, parseTimeToDate, getIqamaTweakerForDay } = require('./utils');

const PRAYER_NAMES = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

function generatePrayerIcsEvents(calendar, iqamaCalendar, year = new Date().getFullYear()) {
    let events = [];

    calendar.forEach((monthObj, monthIndex) => {
        const month = monthIndex + 1;
        Object.keys(monthObj).forEach(day => {
            const prayers = getPrayerTimesForDay(monthObj, day);
            const iqamaTimes = getIqamaTweakerForDay(iqamaCalendar[month], day);

            if (!prayers || !iqamaTimes) return;

            prayers.forEach((time, index) => {
                const startDate = parseTimeToDate(year, month, day, time);
                const endDate = addMinutes(startDate, 20 + iqamaTimes[index]);

                events.push({
                    uid: `${year}${month}${day}${index}@prayers.local`,
                    start: startDate,
                    end: endDate,
                    summary: `${PRAYER_NAMES[index]} prayer`,
                    description: 'Daily Prayer'
                });
            });
        });
    });

    return events;
}

module.exports = {
    generatePrayerIcsEvents
};
