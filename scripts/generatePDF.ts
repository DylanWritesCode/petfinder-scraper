import { Constants } from '../src/constants';
import * as FileUtility from '../src/utilities/FileUtility';
import { PetProfile } from '../src/interfaces/PetProfile';
import {default as path} from 'path'


const rootDir = process.cwd();
const petProfileData:PetProfile[] 
= JSON.parse(FileUtility.readFile(path.join(Constants.outputDirectory, Constants.petProfileDataFile))) as PetProfile[];

console.log("Creating HTML...");
FileUtility.createHtml(rootDir,Constants.outputDirectory,petProfileData);

console.log("Creating PDF...");
FileUtility.processHTMLFilesToPDF(Constants.outputDirectory, "regeneratedPDF.pdf");