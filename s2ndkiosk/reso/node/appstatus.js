const { ipcRenderer, contextBridge } = require('electron');
ipcRenderer.setMaxListeners(0);

contextBridge.exposeInMainWorld('electronAPI', {
    appstatus: (stats) => { // Define the callback parameter here
        ipcRenderer.once('appstatusresult', (event, result) => {
            callback(result);
        });
        ipcRenderer.send('appstatus', stats);
    },
});