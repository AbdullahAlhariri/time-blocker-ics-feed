const https = require('https');

function pad(n) {
    return n.toString().padStart(2, "0");
}

function formatDateToICS(date) {
    return (
        date.getUTCFullYear() +
        pad(date.getUTCMonth() + 1) +
        pad(date.getUTCDate()) +
        "T" +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        "00Z"
    );
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

async function fetchPrayerTimes(mosqueId) {
    const url = `https://mawaqit.net/nl/${mosqueId}`;
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let html = '';
            res.on('data', chunk => html += chunk);
            res.on('end', () => {
                try {
                    const re = new RegExp(/^.*confData\s*=\s*(?<confData>.*);$/m);
                    const match = re.exec(html);
                    if (!match) throw new Error("Could not find confData");
                    const data = match.groups['confData'];
                    const json = JSON.parse(data);
                    resolve([json['calendar'], json['iqamaCalendar']]);
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

function getPrayerTimesForDay(monthObj, day) {
    const times = monthObj[day];
    if (!times) return null;
    let prayers = [times[0], times[1], times[2], times[3], times[4]];
    if (times.length === 6) {
        prayers = [times[0], times[2], times[3], times[4], times[5]];
    }
    return prayers;
}

function getIqamaTweakerForDay(iqamaCalendar, day) {
    return getPrayerTimesForDay(iqamaCalendar, day).map(time => +time.replace('+', ''))
}

function eventsToIcsContent(events, prodId = '-//Prayers//EN') {
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:${prodId}
CALSCALE:GREGORIAN
`;

    events.forEach(event => {
        ics += `BEGIN:VEVENT
UID:${event.uid}
DTSTAMP:${formatDateToICS(new Date())}
DTSTART:${formatDateToICS(event.start)}
DTEND:${formatDateToICS(event.end)}
SUMMARY:${event.summary}
DESCRIPTION:${event.description}
END:VEVENT
`;
    });

    ics += `END:VCALENDAR`;
    return ics;
}

function parseTimeToDate(year, month, day, timeString) {
    const [hour, minute] = timeString.split(":").map(Number);
    return new Date(year, month - 1, Number(day), hour, minute);
}

module.exports = {
    pad,
    formatDateToICS,
    addMinutes,
    fetchPrayerTimes,
    getPrayerTimesForDay,
    eventsToIcsContent,
    getIqamaTweakerForDay,
    parseTimeToDate
};
