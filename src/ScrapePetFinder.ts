import puppeteer, { Browser, Page } from 'puppeteer';
import pLimit from 'p-limit';
import * as FileUtility from './utilities/FileUtility';
import {Constants} from './constants';
import {default as path} from 'path'
import { Data } from './interfaces/Data';
import { Config } from './interfaces/Config';

let limit = pLimit(10);

let rootDir = process.cwd();

const dataFilePath = path.join(rootDir,Constants.dataDirectory, Constants.dataFile);
const htmlFilePath = path.join(rootDir,Constants.outputDirectory, Constants.htmlFile);
const htmlDirectory = path.join(rootDir,Constants.outputDirectory,Constants.htmlDirectory);

//If exists lets delete the file.
FileUtility.deleteFile(htmlFilePath);
FileUtility.deleteFilesInDirectory(htmlDirectory);

let petfindSearchPageUrl:string | undefined = undefined;
let pdfName: string | undefined = undefined;
let wordDocName: string | undefined = undefined;
let chromiumExecutablePath: string;

let minPage = 1;
let maxPage = 1;

const petLinks:string[] = [];
let processedLinks: Data[] = [];
let browser:Browser | undefined = undefined;

export function initialize(config:Config, chromeExec:string, rootDirectory: string){
  limit = pLimit(config.ProcessLimit);
  rootDir = rootDirectory;

  petfindSearchPageUrl = config.PetFinderSearchPageUrl;
  pdfName = config.PDFFileName;
  wordDocName = config.WodDocFileName;
  chromiumExecutablePath = chromeExec;

  if(pdfName == undefined || pdfName == null || pdfName == "") {
    throw Error("PDF File name is required.");
  }

  if(wordDocName == undefined || wordDocName == null || wordDocName == "") {
    throw Error("Word Doc File name is required.");
  }


  console.log("PetFinder Scraper initialized.");

  if(FileUtility.fileExists(dataFilePath)) {
    const backupDataFileDirectoryPath = path.join(Constants.dataDirectory,Constants.backupDataDirectory);
    FileUtility.backupDataFile(dataFilePath, backupDataFileDirectoryPath, config.BackupFileRetentionDays)

    console.log(`Loading saved data...`);
    processedLinks = JSON.parse(FileUtility.readFile(dataFilePath)) as Data[];
    console.log(`${processedLinks.length+1} pet bios already exported.`);
  }
}


export function beginScraper(){
  (async () => {
    console.log(`Output Directory ${path.join(rootDir, Constants.outputDirectory)}`);
    browser = await puppeteer.launch({headless: true, executablePath: chromiumExecutablePath});
    const page = await browser.newPage();
  
    if(petfindSearchPageUrl === undefined || petfindSearchPageUrl === null || petfindSearchPageUrl === ""){
      throw Error("A PetFinder search url is required.");
    }
  
    console.log(`Accessing PetFinder URL: ${petfindSearchPageUrl}...`);
    await page.goto(petfindSearchPageUrl);
    await page.waitForNetworkIdle();
  
    const pageSelector = await page.evaluate(()=>{
      return Promise.resolve(document.querySelector('div[page-select-open-btn]')?.getAttribute("aria-label"));
    });
  
    if(pageSelector != null){
      parsePageNumbers(pageSelector);
    }
  
    console.log(`Number of Search Result Pages Found: ${maxPage}`);
  
    console.log(`Collecting pet listings to process...`);
  
    const queryPetLinksQueue: Promise<any>[] = [];
    for(let i = 1; i < maxPage+1; i++){
      queryPetLinksQueue.push(limit(() => GetAllPetLinks(i)));
    }
    await Promise.all(queryPetLinksQueue);
  
    console.log(`${petLinks.length+1} pet bios found.`);
  
    console.log(`Extracting pet bio data...`);
    const petFlyerBuildQueue: Promise<any>[] = [];
    for (let i = 0; i < petLinks.length; i++){
      petFlyerBuildQueue.push(limit(()=> BuildPetFlyer(petLinks[i])));
    }
  
    await Promise.all(petFlyerBuildQueue);
  
    await limit(() => BuildPetFlyer(petLinks[0])); //Remove after testing
    console.log('Pet Finder data extraction. Complete!');

    console.log('Generating Word Doc file...');
    const wordDocTask = FileUtility.processHTMLFilesToWordDoc(Constants.outputDirectory, htmlDirectory, wordDocName as string);

    console.log('Generating PDF file...');
    const pdfTask = FileUtility.processHTMLFilesToPDF(Constants.outputDirectory,htmlDirectory, pdfName as string);

    await wordDocTask;
    await pdfTask;
    
    console.log('Cleaning up HTML meta data...');
    FileUtility.deleteFilesInDirectory(htmlDirectory);

    await browser.close();
    console.log("Process Complete! You can now close this application.");
  })();
}

async function GetAllPetLinks(index:number){
  if(browser == undefined){
    console.log("ERROR: Could not query page. Browser is undefined.");
    return;
  }

  const page = await browser.newPage();

  try{

    await page.goto(`${petfindSearchPageUrl}&page=${index}`);
    
    await page.waitForSelector("div[page-select-open-btn]", { visible: true, timeout: 90000 });
    await page.waitForNetworkIdle();

    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    const linkList = await page.evaluate(()=>{
      return Promise.resolve(Array.from(document.querySelectorAll('.petCard-link')).map(element => element.getAttribute("href")));
    });

    linkList.forEach((link)=>{
      if(link != null && !petLinks.includes(link) && processedLinks.find(x=> x.Url == link) == undefined){
        petLinks.push(link);
      }
    });

  } catch(ex) {
    console.error(`ERROR: Could not query PetFinder search result page ${index}. Exception:${ex}`);
  } finally{
    page.close();
  }
}

async function BuildPetFlyer(url:string){
  if(browser == undefined){
    console.error("ERROR: Could not query pet bio page. Browser is undefined.");
    return;
  }

  const page = await browser.newPage();

  try{

    await page.goto(url);
    await page.waitForNetworkIdle();
  
    const petNamePromise = page.evaluate(()=>{
      return Promise.resolve(document.querySelector('span[data-test="Pet_Name"')?.textContent);
    });

    const petBioPromise = page.evaluate(()=>{
      return Promise.resolve(document.querySelector('div[data-test="Pet_Story_Section"]')?.innerHTML);
    });

    const petImageUrlPromise = page.evaluate(()=>{
      return Promise.resolve(document.querySelector('img[pfdc-pet-carousel-slide]')?.getAttribute("src"));
    });


    const petNameData = await petNamePromise;
    const petBioData = await petBioPromise;

    const petImageUrl = await petImageUrlPromise;

    if(petImageUrl == null){
      throw(`ERROR: could not retrieve PetImage.`);
    }

    if(petNameData == null){
      throw(`ERROR: could not retrieve PetName.`)
    }

    if(petBioData == null) {
      throw(`ERROR: could not retrieve PetBio.`)
    }
    
    let template = FileUtility.getTemplate(path.join(rootDir,Constants.templateFileName));
    template = template.replace("{{PetName}}", petNameData.trim());
    template = template.replace("{{PetBio}}", petBioData.replace(`Meet ${petNameData.trim()}!`, "").replace(`Meet ${petNameData.trim()}`,"").replace("<br>\n<br>", ""));
    template = template.replace("{{PetImage}}", petImageUrl);

    FileUtility.writeFile(`${htmlDirectory}//${petNameData.trim()}.html`, template);

    console.log(`Extracted bio for pet '${petNameData.trim()}'`);
    
    //update processed url list
    const processedUrl: Data =  {
      PetName: petNameData.trim(),
      Url: url
    }
    processedLinks.push(processedUrl);
    FileUtility.writeFile(dataFilePath, JSON.stringify(processedLinks, null, 4));

  } catch(ex) {
    console.error(`ERROR: An error occured when query'ing PetUrL ${url}. Exception:${ex}`);
  } finally{
    page.close();
  }
}

function parsePageNumbers(pageText:string){
  const seperatedValues = pageText.split(', ');

  const minPageString = seperatedValues[seperatedValues.length-1].replace("PAGE ", "").split("/")[0];
  const maxPageString = seperatedValues[seperatedValues.length-1].replace("PAGE ", "").split("/")[1];
  
  if(isNumeric(minPageString) && isNumeric(maxPageString)){
    minPage = Number(minPageString);
    maxPage = Number(maxPageString);
  }
}

function isNumeric(str: string): boolean {
  const num = Number(str);
  return !isNaN(num);
}