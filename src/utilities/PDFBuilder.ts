import * as FileUtility from '../FileUtility'

const defaultOutputDirectoryName = "output";

(async () => {
    await FileUtility.processHTMLFilesToPDF(defaultOutputDirectoryName);
})();