const { app } = require('electron')
const path = require('path')
const WebSocket = require('ws')

// define the main folder
let resourcesPath;
if (!app.isPackaged) {
    // if using npm/yarn start
    resourcesPath = path.resolve('resources');
} else if (process.platform == "win32") { // if on Windows
    resourcesPath = path.resolve('resources', 'app.asar', 'resources');
} else if (process.platform == "darwin") { // if on MacOS
    // The ../../../.. here is specific to how/where the executable ends up after
    // it gets packaged into the .app
    resourcesPath = path.resolve(process.execPath, "../../../..", 'resources');
} else { // if on Linux
    resourcesPath = path.resolve('resources');
}

loadExecFile();
async function loadExecFile() {
    try {
        const executable = require(resourcesPath + "/Scripts/Executable.js");
        // we pass the WebSocket class because i coudnt figure out a better way to load it there
        // im blaming electron on this one
        executable(resourcesPath, __dirname, WebSocket);
    } catch (error) {
        console.log(error);
    }
}
