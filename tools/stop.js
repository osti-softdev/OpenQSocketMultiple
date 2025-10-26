const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const root = path.join(__dirname, '..');
const pidFile = path.join(root, 'reso', 'outfolder', 'app.pid');

if (!fs.existsSync(pidFile)) {
  console.error(`PID file not found: ${pidFile}`);
  process.exit(1);
}

const pid = parseInt(fs.readFileSync(pidFile, 'utf8'), 10);
if (isNaN(pid)) {
  console.error(`Invalid PID in ${pidFile}`);
  process.exit(1);
}

console.log(`Stopping process ${pid}...`);

if (process.platform === 'win32') {
  exec(`taskkill /PID ${pid} /F`, (err, stdout, stderr) => {
    if (err) {
      console.error('Failed to stop process:', err.message);
      process.exit(1);
    }
    try { fs.unlinkSync(pidFile); } catch(e) {}
    console.log('Stopped.');
  });
} else {
  try {
    process.kill(pid, 'SIGTERM');
    try { fs.unlinkSync(pidFile); } catch(e) {}
    console.log('Stopped.');
  } catch (err) {
    console.error('Failed to stop process:', err.message);
    process.exit(1);
  }
}
