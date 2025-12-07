import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

const HISTORY_FILE = path.join(__dirname, "data/history.json");

// --- Helpers para historial ---
function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
  } catch {
    return { urls: [], folders: [] };
  }
}

function saveHistory(data) {
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
}

function addToHistory(type, value) {
  const history = loadHistory();
  if (!history[type].includes(value)) {
    history[type].unshift(value);
    history[type] = history[type].slice(0, 10);
    saveHistory(history);
  }
}

// --- Crear ventana ---
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);

// --- IPC Handlers ---
// Obtener historial
ipcMain.handle("get-history", () => loadHistory());

// Seleccionar carpeta
ipcMain.handle("select-folder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ["openDirectory"] });
  return result.filePaths[0] || null;
});

// Ejecutar SpotDL
ipcMain.on("run-spotdl", (event, args) => {
  const { playlistUrl, outputDir } = args;
  addToHistory("urls", playlistUrl);
  addToHistory("folders", outputDir);

  let playlistFolder = outputDir;

  const spotdl = spawn("spotdl", ["download", playlistUrl, "--output", outputDir]);

  let downloaded = 0;
  let failed = 0;

  spotdl.stdout.on("data", data => {
    const msg = data.toString();
    mainWindow.webContents.send("spotdl-log", msg);

    // Crear carpeta con nombre de playlist si SpotDL indica
    if (msg.includes("Fetching playlist:")) {
      const name = msg.replace("Fetching playlist:", "").trim();
      playlistFolder = path.join(outputDir, name);
      if (!fs.existsSync(playlistFolder)) fs.mkdirSync(playlistFolder, { recursive: true });
    }

    // Contador de éxitos y fallos
    if (msg.includes("Downloaded")) downloaded++;
    if (msg.includes("Could not find") || msg.includes("Error")) failed++;

    mainWindow.webContents.send("spotdl-progress", { downloaded, failed });
  });

  spotdl.stderr.on("data", data => {
    mainWindow.webContents.send("spotdl-log", data.toString());
  });

  spotdl.on("close", code => {
    mainWindow.webContents.send("spotdl-log", `Proceso finalizado con código: ${code}`);
  });
});
