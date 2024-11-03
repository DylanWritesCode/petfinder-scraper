import * as fs from 'fs';
import download from 'download-chromium';

async function ensureChromiumDownloaded() {
    if (!fs.existsSync('dist//chromium')) {
        await download({ installPath: 'dist//chromium' });
    }
}

ensureChromiumDownloaded().catch(console.error);