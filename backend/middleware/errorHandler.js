// Formål: fælles fejlhåndtering (error-handling middleware). Alle fejl ender her,
// så klienten altid får en passende HTTP-statuskode og et svar i JSON.
// Stack traces og interne detaljer sendes aldrig til klienten, fordi de kan
// hjælpe en angriber med at kortlægge systemet.

const { AppError } = require('../errors');

// Express kender en error handler på, at den har fire parametre (err, req, res, next).
// Express 5 sender også fejl fra async-ruter hertil automatisk.
function errorHandler(err, req, res, next) {
  // Forventede fejl fra vores egen kode: brug fejlens statuskode og besked
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }

  // Body, der ikke er gyldig JSON (fra express.json())
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Ugyldig JSON i requestens body' });
  }

  // Body over grænsen i express.json() / express.urlencoded()
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Requestens body er for stor' });
  }

  // Uventede fejl: log dem på serveren, men vis kun en generel besked til klienten
  console.error(err);
  res.status(500).json({ error: 'Der skete en fejl på serveren' });
}

module.exports = errorHandler;
