import { exec } from "child_process";
import fs from "fs";

// === CONFIG ===
const playlistUrl = "https://open.spotify.com/playlist/37i9dQZF1DZ06evO0Wjw9R?si=3a28b1df549f434a";
const outputFolder = "~/Music/chaquenio";
const failedListFile = "faltantes.txt";

// Comando spotdl moderno
const cmd = `python3.11 -m spotdl download "${playlistUrl}" --output ${outputFolder} --bitrate 320k --format mp3`;

console.log("Iniciando descarga de la playlist...");

// === VARIABLES ===
let downloaded = 0;
let failed = 0;
let failedTracks = []; // ← Aquí guardamos los fallos

const spotdlProcess = exec(`caffeinate -i ${cmd}`);

// === PROCESAR OUTPUT ===
spotdlProcess.stdout.on("data", data => {
    process.stdout.write(data);

    // Canción descargada
    if (data.includes("Downloaded")) {
        downloaded++;
    }

    // Canción fallida
    if (data.includes("Could not find")) {
        failed++;

        // Extraer nombre del track desde el texto
        const match = data.match(/Could not find match for "(.*)"/);
        if (match && match[1]) {
            failedTracks.push(match[1]);
        }
    }
});

spotdlProcess.stderr.on("data", data => {
    process.stderr.write(data);

    // También pueden aparecer errores aquí
    if (data.includes("Could not find")) {
        failed++;

        const match = data.match(/Could not find match for "(.*)"/);
        if (match && match[1]) {
            failedTracks.push(match[1]);
        }
    }
});

// === FIN DEL PROCESO ===
spotdlProcess.on("close", code => {
    console.log("\n--- RESUMEN FINAL ---");
    console.log(`Canciones descargadas: ${downloaded}`);
    console.log(`Canciones fallidas: ${failed}`);
    console.log(`Carpeta de descarga: ${outputFolder}`);

    // Crear archivo de faltantes
    if (failedTracks.length > 0) {
        fs.writeFileSync(failedListFile, failedTracks.join("\n"));
        console.log(`\nSe generó el archivo ${failedListFile} con las canciones no descargadas.`);
        console.log(`Puedes descargarlas luego con:\n`);
        console.log(`python3.11 -m spotdl download --list ${failedListFile} --output ${outputFolder}`);
    } else {
        console.log("\nNo hubo canciones faltantes. 🎉");
    }

    console.log("----------------------");
});
