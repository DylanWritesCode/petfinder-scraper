import {default as fs} from 'fs';
import {default as path} from 'path';
import {Config} from './interfaces/Config';
import * as petFinderScraper from './ScrapePetFinder';
import puppeteer from 'puppeteer';


declare var process : {
    cwd(): string;
    pkg: any,
    argv: string[]
}

const isPkg = typeof process.pkg !== 'undefined';
const chromiumExecutablePath = isPkg ? puppeteer.executablePath().replace(
    /^.*?\\node_modules\\puppeteer\\\.local-chromium/,
    'chromium' // Replace with your desired folder name
  )
: puppeteer.executablePath();

const parentDir = process.cwd();
if(isPkg && !fs.existsSync(path.join(parentDir,"chromium"))) {
    const test = path.join(parentDir,"chromium");
    console.log(test);
    throw Error(`Dependency: Chromium is missing Path:${test}`);
}
const config = JSON.parse(fs.readFileSync(path.join(parentDir,"config.json"), 'utf8')) as Config;

console.log('App Started.');
console.log('Initializing PetFinder scraper...')

petFinderScraper.initialize(config, chromiumExecutablePath, parentDir);

console.log("Starting PetFinder scraping...");
petFinderScraper.beginScraper();