const { addMinutes, getPrayerTimesForDay, parseTimeToDate } = require('./utils');

function generateSleepIcsEvents(calendar, year = new Date().getFullYear()) {
    let events = [];
    const sleepGoalHours = 8;
    const PRAYER_DURATION = 45;

    let lastNightDurationHours = null;

    calendar.forEach((monthObj, monthIndex) => {
        const month = monthIndex + 1;
        const days = Object.keys(monthObj).sort((a, b) => Number(a) - Number(b));
        
        days.forEach(day => {
            const prayers = getPrayerTimesForDay(monthObj, day);
            if (!prayers) return;

            const fajrTime = prayers[0];
            const ishaTime = prayers[4];

            const fajrTodayStart = parseTimeToDate(year, month, day, fajrTime);
            const ishaTodayStart = parseTimeToDate(year, month, day, ishaTime);

            // 1. Part 2 of last night's sleep (if applicable)
            // This occurs in the morning of the current day
            if (lastNightDurationHours !== null && lastNightDurationHours < sleepGoalHours) {
                const sleep2Start = addMinutes(fajrTodayStart, PRAYER_DURATION);
                const remainingHours = sleepGoalHours - lastNightDurationHours;
                
                if (remainingHours >= 1) {
                    events.push({
                        uid: `${year}-${month}-${day}-sleep-2@sleep.local`,
                        start: sleep2Start,
                        end: addMinutes(sleep2Start, remainingHours * 60),
                        summary: 'Sleep (Part 2)',
                        description: `Remaining ${remainingHours.toFixed(1)} hours sleep after Fajr`
                    });
                }
            }

            // 2. Part 1 of tonight's sleep
            // Starts after Isha today, ends at Fajr tomorrow
            
            // Get tomorrow's Fajr time (approximation using today's or lookahead)
            let nextFajrTime = fajrTime;
            const nextDayNum = Number(day) + 1;
            if (monthObj[nextDayNum]) {
                const nextPrayers = getPrayerTimesForDay(monthObj, nextDayNum);
                if (nextPrayers) nextFajrTime = nextPrayers[0];
            } else if (calendar[monthIndex + 1]) {
                const nextMonthPrayers = getPrayerTimesForDay(calendar[monthIndex + 1], 1);
                if (nextMonthPrayers) nextFajrTime = nextMonthPrayers[0];
            }

            const sleepStart = addMinutes(ishaTodayStart, PRAYER_DURATION);
            
            // Robust way to get tomorrow's Fajr start date
            const nextDayDate = new Date(ishaTodayStart);
            nextDayDate.setDate(nextDayDate.getDate() + 1);
            const [fHour, fMinute] = nextFajrTime.split(':').map(Number);
            const fajrTomorrowStart = new Date(nextDayDate.getFullYear(), nextDayDate.getMonth(), nextDayDate.getDate(), fHour, fMinute);

            const nightDurationHours = (fajrTomorrowStart - sleepStart) / (1000 * 60 * 60);

            if (nightDurationHours >= sleepGoalHours) {
                events.push({
                    uid: `${year}-${month}-${day}-sleep@sleep.local`,
                    start: sleepStart,
                    end: addMinutes(sleepStart, sleepGoalHours * 60),
                    summary: 'Sleep',
                    description: '8 hours sleep block'
                });
                lastNightDurationHours = sleepGoalHours;
            } else {
                events.push({
                    uid: `${year}-${month}-${day}-sleep-1@sleep.local`,
                    start: sleepStart,
                    end: fajrTomorrowStart,
                    summary: 'Sleep (Part 1)',
                    description: 'Split sleep: End of Isha to Fajr'
                });
                lastNightDurationHours = nightDurationHours;
            }
        });
    });

    return events;
}

module.exports = {
    generateSleepIcsEvents
};
