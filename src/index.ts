import {default as fs} from 'fs'
import {Config} from './interfaces/Config';
import * as petFinderScraper from './utilities/ScrapePetFinder';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf8')) as Config;

console.log('App Started.');
console.log('Initializing PetFinder scraper...')

petFinderScraper.initialize(config.PetFinderSearchPageUrl, config.PDFFileName);
petFinderScraper.beginScraper();