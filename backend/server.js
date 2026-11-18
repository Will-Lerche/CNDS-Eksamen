// Formål: starter HTTP-serveren. Node lytter på 127.0.0.1, så appen kun kan
// nås gennem Nginx på samme maskine og ikke direkte udefra.

const app = require('./app');
const { config } = require('./config');

const server = app.listen(config.port, config.host, () => {
  console.log(`Serveren kører på http://localhost:${config.port} (${config.nodeEnv})`);
  console.log(`Admin kører på http://admin.localhost:${config.port}`);
});

// Fx hvis porten allerede er i brug af et andet program
server.on('error', (err) => {
  console.error('Serveren kunne ikke starte:', err.message);
  process.exit(1);
});
