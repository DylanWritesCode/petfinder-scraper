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

export function getTemplate():string {
  return fs.readFileSync("template.html").toString();
}


export async function processFilesToPDF(directory:string){
  const files = fs.readdirSync(directory);
  files.sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });

  const htmlCollection: string[] = [];
  files.forEach(x=> {
    if(x.includes(".html")) {
      htmlCollection.push(readFile(`${directory}\\${x}`));
    }
  });

  console.log("Generating Master PDF...");
  await convertHtmlToPdf(`${directory}\\A-Z_SavingHopePetBios.pdf`, htmlCollection.join("\r\n"));
  console.log("Generated Master PDF");
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

function readFile(filePath:string):string {
  return fs.readFileSync(filePath).toString();
}
