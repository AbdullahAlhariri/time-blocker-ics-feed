const fs = require('fs');
const path = require('path');
const http = require('http');
const { fetchPrayerTimes, eventsToIcsContent } = require('./blocks/utils');
const { generatePrayerIcsEvents } = require('./blocks/prayers');
const { generateSleepIcsEvents } = require('./blocks/sleep');

const PORT = process.env.PORT || 3000;
const CLIENT_DIST = path.join(__dirname, 'client', 'dist');

const server = http.createServer(async (req, res) => {
    const url = req.url;

    if (url === '/health') {
        res.writeHead(200);
        res.end('OK');
        return;
    }

    // Match /ics/<mosqueId>/<type>
    const icsMatch = url.match(/^\/ics\/(.+)\/(prayers|sleep)$/);
    if (icsMatch) {
        const mosqueId = icsMatch[1];
        const type = icsMatch[2];

        try {
            const [calendar, iqamaCalendar] = await fetchPrayerTimes(mosqueId);
            let events = [];
            let filename = 'calendar.ics';

            if (type === 'prayers') {
                events = generatePrayerIcsEvents(calendar, iqamaCalendar);
                filename = 'prayers.ics';
            } else if (type === 'sleep') {
                events = generateSleepIcsEvents(calendar);
                filename = 'sleep.ics';
            }

            const icsContent = eventsToIcsContent(events);

            res.writeHead(200, {
                'Content-Type': 'text/calendar',
                'Content-Disposition': `attachment; filename="${filename}"`
            });
            res.end(icsContent);
            return;
        } catch (e) {
            console.error(e);
            res.writeHead(500);
            res.end('Error generating feed: ' + e.message);
            return;
        }
    }

    // Serve static files from client/dist
    let filePath = path.join(CLIENT_DIST, url === '/' ? 'index.html' : url);
    
    // Safety check to prevent directory traversal
    if (!filePath.startsWith(CLIENT_DIST)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // If file not found, serve index.html for SPA routing (though not strictly needed here)
            filePath = path.join(CLIENT_DIST, 'index.html');
        }

        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.svg': 'image/svg+xml',
        };

        res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
