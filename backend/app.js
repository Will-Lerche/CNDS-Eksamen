// Formål: opretter Express-appen. Her sættes middleware, statiske filer og ruter
// sammen i den rækkefølge, en request løber igennem dem. Filen starter ikke
// serveren (det gør server.js), så appen også kan bruges i tests.

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');

const { isAdminHost } = require('./middleware/requireAdminHost');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');

const app = express();
const frontendDir = path.join(__dirname, '..', 'frontend');

// Appen kører bag Nginx (reverse proxy). Med 'loopback' stoler Express på
// X-Forwarded-For og X-Forwarded-Proto fra Nginx på samme maskine, så vi ser
// klientens rigtige IP (vigtigt for rate limiting) og ved, at den kom via HTTPS.
app.set('trust proxy', 'loopback');

// Fjerner headeren "X-Powered-By: Express", så svaret ikke afslører teknologien.
app.disable('x-powered-by');

// Middleware, der læser requestens body. Grænsen på 10 kB beskytter mod meget
// store requests, der kan bruges til at overbelaste serveren.
app.use(express.json({ limit: '10kb' }));                          // JSON fra vores egen frontend
app.use(express.urlencoded({ extended: false, limit: '10kb' }));   // formulardata, fx webhooks fra Twilio
app.use(cookieParser());                                           // læser Cookie-headeren til req.cookies

// API-ruter
app.use('/api/health', healthRouter);

// Statiske filer (HTML, CSS og JS i browseren).
// shared/ bruges af begge sider. hotel/ vises på hoveddomænet og admin/ på admin-subdomænet.
const hotelFiles = express.static(path.join(frontendDir, 'hotel'));
const adminFiles = express.static(path.join(frontendDir, 'admin'), { index: 'login.html' });

app.use('/shared', express.static(path.join(frontendDir, 'shared')));
app.use((req, res, next) => {
  if (isAdminHost(req)) {
    return adminFiles(req, res, next);
  }
  return hotelFiles(req, res, next);
});

// Skal ligge til sidst: 404 for alt, der ikke matchede, og derefter fælles fejlhåndtering
app.use(notFound);
app.use(errorHandler);

module.exports = app;
