import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Declaramos la ventana global
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);

// ---- Seleccionar carpeta ----
ipcMain.handle("select-folder", async () => {
  console.log("select-folder llamado");
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"]
  });

  if (result.canceled) return null;
  return result.filePaths[0];
});

// ---- Ejecutar spotdl ----
ipcMain.on("run-spotdl", (event, args) => {
  const { playlistUrl, outputDir } = args;

  const spotdl = spawn("spotdl", [
    "download",
    playlistUrl,
    "--output",
    outputDir,
    "--bitrate",
    "320k",
    "--format",
    "mp3"
  ]);

  spotdl.stdout.on("data", (data) => {
    mainWindow.webContents.send("spotdl-log", data.toString());
  });

  spotdl.stderr.on("data", (data) => {
    mainWindow.webContents.send("spotdl-log", data.toString());
  });

  spotdl.on("close", (code) => {
    mainWindow.webContents.send("spotdl-log", `Proceso finalizado: ${code}`);
  });
});
