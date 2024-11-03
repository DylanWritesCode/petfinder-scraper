import * as fs from 'fs';
import * as path from 'path';

import { html2pdf } from 'html2pdf-ts';
import { HTML2PDFOptions } from 'html2pdf-ts';

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

export function getTemplate():string {
  return fs.readFileSync("template.html").toString();
}

export async function processHTMLFilesToPDF(outputDirectory:string,htmlDirectory:string, pdfName:string){
  const files = fs.readdirSync(htmlDirectory);
  files.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  const htmlCollection: string[] = [];
  files.forEach(x=> {
    if(x.includes(".html")) {
      htmlCollection.push(readFile(path.join(htmlDirectory,x)));
    }
  });

  await convertHtmlToPdf(path.join(outputDirectory,pdfName), htmlCollection.join("\r\n"));
  console.log(`PDF file created - ${path.join(outputDirectory,pdfName)}`);
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
