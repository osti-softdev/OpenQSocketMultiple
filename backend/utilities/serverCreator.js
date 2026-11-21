const rootpath = global.BACKEND_PATH;
const { loadConfig } = require(`${rootpath}/utilities/envconfig`);

async function serverCreator(server) {
  const config = loadConfig();
  const serverPort = config?.MainServer?.port || 3000;

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Main App is already running on port ${serverPort}. Preventing second instance from starting.`);
      try {
        if (process.versions && process.versions.electron) {
          const { app } = require('electron');
          if (app) app.exit(0);
        }
      } catch (e) {}
      process.exit(0);
    } else {
      console.error('Server error:', err);
    }
  });

  server.listen(serverPort, '0.0.0.0', () => {
    console.log(`Queue System running on http://localhost:${serverPort}`);
  });
}

module.exports = { serverCreator };
