const { contextBridge, ipcRenderer } = require("electron");

console.log("PRELOAD CARGADO!");

contextBridge.exposeInMainWorld("electronAPI", {
  chooseFolder: () => ipcRenderer.invoke("select-folder"),
  runSpotdl: (url, output) => ipcRenderer.send("run-spotdl", { playlistUrl: url, outputDir: output }),
  onSpotdlLog: (cb) => ipcRenderer.on("spotdl-log", (_, d) => cb(d))
});
