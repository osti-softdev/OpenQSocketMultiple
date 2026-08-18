import { FFmpeg } from "/libs/ffmpeg-0.12.15/package/dist/esm/index.js";

// console.log('Imported FFmpeg:', FFmpeg);

const ffmpegInstance = new FFmpeg();

async function fetchFile(file) {
    if (typeof file === 'string') {
        const response = await fetch(file);
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    } else if (file instanceof File || file instanceof Blob) {
        const buffer = await file.arrayBuffer();
        return new Uint8Array(buffer);
    } else if (file instanceof Uint8Array) {
        return file;
    } else {
        throw new Error('fetchFile: Invalid input type');
    }
}

window.ffmpegInstance = ffmpegInstance;
window.fetchFile = fetchFile;

window.ffmpegCoreURL = "/libs/core-0.12.10/package/dist/esm/ffmpeg-core.js";
window.ffmpegWasmURL = "/libs/core-0.12.10/package/dist/esm/ffmpeg-core.wasm";
window.ffmpegMtWorkerURL = "/libs/core-mt-0.12.10/package/dist/esm/ffmpeg-core.worker.js";

console.log('Assigned ffmpegInstance:', window.ffmpegInstance);
console.log('Assigned fetchFile:', window.fetchFile);