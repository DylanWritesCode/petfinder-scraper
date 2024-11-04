import * as fs from 'fs';
import * as path from 'path';

import { html2pdf } from 'html2pdf-ts';
import { HTML2PDFOptions } from 'html2pdf-ts';
import * as htmlDocx from 'html-docx-js';
import { Constants } from '../constants';
import { PetProfile } from '../interfaces/PetProfile';

export async function writeFile(filePath: string, data: string): Promise<void> {
  const dir = path.dirname(filePath);
  // Create directory if it doesn't exist

  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  // Write file
  await fs.promises.writeFile(filePath, data);
}

export async function appendFile(filePath: string, data: string): Promise<void>{
  const dir = path.dirname(filePath);
  // Create directory if it doesn't exist

  if (!fs.existsSync(dir)) {
    await fs.promises.mkdir(dir, { recursive: true });
  }

  // Write file
  if(!fs.existsSync(filePath)){
    await fs.promises.writeFile(filePath, data);
  } else {
    await fs.promises.appendFile(filePath, `\r\n${data}`);
  }
}

export function getTemplate(templatePath:string):string {
  return fs.readFileSync(templatePath).toString();
}

const htmlCollection: string[] = [];
export async function processHTMLFilesToPDF(outputDirectory:string,pdfName:string){
  const content = htmlCollection.join("\r\n");
  await convertHtmlToPdf(path.join(outputDirectory,pdfName), content);
  console.log(`PDF file created - ${path.join(outputDirectory,pdfName)}`);
}

export async function createHtml(rootDir:string, outputDirectory:string, petProfileData:PetProfile[]){
  const sortedPetprofiles = petProfileData.sort(function (a, b) {
    return a.PetName.toLowerCase().localeCompare(b.PetName.toLowerCase());
  });

  const template = getTemplate(path.join(rootDir,Constants.templateFileName));
  for(let i = 0; i < sortedPetprofiles.length; i++) {
    const petProfile = sortedPetprofiles[i];
    let profileHtml = template;

    profileHtml = profileHtml.replace("{{PetName}}", petProfile.PetName);
    profileHtml = profileHtml.replace("{{PetBio}}", petProfile.PetBio);
    profileHtml = profileHtml.replace("{{PetImage}}", petProfile.ImageUrl);

    htmlCollection.push(profileHtml);
  }

  writeFile(path.join(outputDirectory,Constants.mergedHtmlFile), htmlCollection.join("\r\n"));
  console.log('HTML file created.');
}

export function deleteFile(filePath:string){
  if(fs.existsSync(filePath)){
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log('File deleted successfully');
    });
  }
}

export function deleteFilesInDirectory(dirPath:string) {
  if(!fs.existsSync(dirPath)) return;
  
  fs.readdir(dirPath, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      const filePath = path.join(dirPath, file);

      fs.stat(filePath, (err, stats) => {
        if (err) throw err;

        if (stats.isFile()) {
          fs.unlink(filePath, (err) => {
            if (err) throw err;
          });
        }
      });
    }
  });
}
export function backupDataFile(dataFilePath:string, backupDirectoryPath:string, fileRetentionDays:number){

  //Delete OLD Backup Files
  if(fs.existsSync(backupDirectoryPath)){
    const backupFiles = fs.readdirSync(backupDirectoryPath);
    for(let i = 0; i < backupFiles.length; i++) {
      const fileStat = fs.statSync(path.join(backupDirectoryPath,backupFiles[i]));
      if(fileStat.birthtime.getDate() < (new Date().getDate() - fileRetentionDays)) {
        fs.unlink(path.join(backupDirectoryPath,backupFiles[i]), (err)=>{
          if(err) console.error(err);
        });
      }
    }
  }

  if(fs.existsSync(dataFilePath)) {
    const fileContent = readFile(dataFilePath);

    const timestamp = Date.now(); // Get current timestamp in milliseconds
    const filename = `${path.parse(dataFilePath).name}_${timestamp}.json`; 

    writeFile(path.join(backupDirectoryPath, filename), fileContent);
  }
}

async function convertHtmlToPdf(filePath:string, content:string) {
  const options:HTML2PDFOptions = {
    format: 'A4',
    filePath: filePath,
    landscape: false,
    resolution: {
      width: 1920,
      height: 1080
    }
  }

  await html2pdf.createPDF(content, options);
}
export function fileExists(filePath:string):boolean{
  return fs.existsSync(filePath);
}

export function readFile(filePath:string):string {
  return fs.readFileSync(filePath).toString();
}
