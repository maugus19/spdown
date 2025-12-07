const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  chooseFolder: () => ipcRenderer.invoke("select-folder"),
  runSpotdl: (url, output) => ipcRenderer.send("run-spotdl", { playlistUrl: url, outputDir: output }),
  onSpotdlLog: (cb) => ipcRenderer.on("spotdl-log", (_, d) => cb(d)),
  onProgress: (cb) => ipcRenderer.on("spotdl-progress", (_, d) => cb(d)),
  getHistory: () => ipcRenderer.invoke("get-history")
});
