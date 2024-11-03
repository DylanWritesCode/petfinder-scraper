import {default as fs} from 'fs';

fs.cpSync("dist//chromium", "release//chromium", {recursive: true});
fs.cpSync("dist//config.json","release//config.json");
fs.cpSync("dist//template.html", "release//template.html");