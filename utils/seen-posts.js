const fs = require('fs');
const path = require('path');

const SEEN_FILE = path.join(__dirname, '..', 'seen_posts.json');
let lastSeenTitles = {};

function loadSeenPosts() {
    if (fs.existsSync(SEEN_FILE)) {
        try {
            const raw = fs.readFileSync(SEEN_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            // Mutate the existing object reference so other modules keep the same reference
            Object.keys(lastSeenTitles).forEach(k => delete lastSeenTitles[k]);
            Object.assign(lastSeenTitles, parsed);
        } catch (err) {
            console.error('❌ Error reading seen posts:', err);
        }
    }
}

function saveSeenPosts() {
    fs.writeFileSync(SEEN_FILE, JSON.stringify(lastSeenTitles, null, 2));
}

module.exports = {
    lastSeenTitles,
    loadSeenPosts,
    saveSeenPosts
};