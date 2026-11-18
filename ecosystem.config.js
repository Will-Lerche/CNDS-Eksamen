// Formål: opsætning til PM2 (procesmanager) på serveren. PM2 holder appen
// kørende og genstarter den, hvis den går ned. Start med:
//   pm2 start ecosystem.config.js
// worker.js tilføjes her, når køen til SMS, e-mail og AI er lavet.

module.exports = {
  apps: [
    {
      name: 'cnds-server',
      script: 'backend/server.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
