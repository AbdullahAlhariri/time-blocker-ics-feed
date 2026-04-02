const https = require('https');
const fs = require("fs");

const mosqueId =  process.argv[2];

const url = `https://mawaqit.net/nl/${mosqueId}`

// ====== CONFIG ======
const YEAR = 2026;                 // Change year if needed
const EVENT_DURATION_MIN = 45;     // 45 minutes per prayer
const OUTPUT_FILE = "prayers.ics";
const prayerName = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

// ====== LOAD YOUR JSON ======
const day = new Date().getDate();
const month = new Date().getMonth();

https.get(url, (res) => {
    let html = '';

    res.on('data', chunk => {
        html += chunk;
    });

    res.on('end', () => {
        try {
            const re = new RegExp(/^.*confData\s*=\s*(?<confData>.*);$/m);
            const data = re.exec(html).groups['confData']

            const json = JSON.parse(data);
            const prayers = json['calendar'][month][day]
            prayers.splice(1,1)


            buildIcsFile(json['calendar'])

        } catch (e) {
            console.error('Failed to parse response as JSON:', e.message);
        }

    });

}).on('error', (err) => {
    write()
});

// const data = require("./prayer-times.json"); // your JSON file

// ====== HELPERS ======
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

function buildIcsFile(data) {
    // ====== BUILD ICS FILE ======
    let icsContent = `BEGIN:VCALENDAR
    VERSION:2.0
    PRODID:-//Prayers//EN
    CALSCALE:GREGORIAN
    `;

    data.forEach((monthObj, monthIndex) => {
        const month = monthIndex + 1;

        Object.keys(monthObj).forEach(day => {
            const times = monthObj[day];

            // Use first 5 prayer times
            let prayers = [times[0], times[1], times[2], times[3], times[4]];
            if (times.length === 6) {
                prayers = [times[0], times[2], times[3], times[4], times[5]];
            }

            prayers.forEach((time, index) => {
                const [hour, minute] = time.split(":").map(Number);

                const startDate = new Date(YEAR, month - 1, Number(day), hour, minute);
                const endDate = addMinutes(startDate, EVENT_DURATION_MIN);

                icsContent += `
BEGIN:VEVENT
UID:${YEAR}${month}${day}${index}@prayers.local
DTSTAMP:${formatDateToICS(new Date())}
DTSTART:${formatDateToICS(startDate)}
DTEND:${formatDateToICS(endDate)}
SUMMARY:${prayerName[index]} prayer 
DESCRIPTION:Daily Prayer
END:VEVENT
    `;
            });
        });
    });

    icsContent += `END:VCALENDAR`;

    // ====== SAVE FILE ======
    fs.writeFileSync(OUTPUT_FILE, icsContent);

    console.log("ICS file created:", OUTPUT_FILE);

}
