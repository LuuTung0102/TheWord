if (!window.electronImports) {
  const { ipcRenderer } = require("electron");
  window.ipcRenderer = ipcRenderer;
  window.electronImports = true;
}
