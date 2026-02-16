const rootpath = global.BACKEND_PATH;
const { loadConfig } = require(`${rootpath}/utilities/envconfig`);

async function serverCreator(server) {
  const config = loadConfig();
  const serverPort = config?.MainServer?.port || 3000;
  server.listen(serverPort, () => {
    console.log(`Queue System running on http://localhost:${serverPort}`);
  });
}

module.exports = { serverCreator };
