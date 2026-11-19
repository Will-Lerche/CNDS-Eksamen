// Formål: beskytter mod CSRF (Cross-Site Request Forgery). Et fremmed website
// kan få gæstens browser til at sende en request til vores API, og browseren
// sender så automatisk gæstens cookie med. Browseren sætter dog altid
// Origin-headeren til det website, requesten kom fra, og den kan ikke ændres af
// et script på siden. Derfor afviser vi ændringer (POST, PUT, PATCH og DELETE),
// hvis Origin ikke er præcis vores egen host.
// Supplerer SameSite-flaget på cookien (specs.md, afsnit 6).
// Bruges kun på /api. Webhooks fra Twilio og Mailgun har ingen Origin og
// beskyttes i stedet af deres signatur.

const { config } = require('../config');
const { isAdminHost } = require('./requireAdminHost');

// Metoder, der ændrer data. GET og HEAD må ikke ændre noget og tjekkes ikke.
const METHODS_THAT_CHANGE_DATA = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Origin består af protokol, host og port, fx "https://admin.<domæne>".
// new URL(...).origin fjerner sti og afsluttende skråstreg fra URL'en i .env.
const publicOrigin = new URL(config.publicUrl).origin;
const adminOrigin = new URL(config.adminUrl).origin;

// Middleware: lader requesten fortsætte, hvis den ikke ændrer data, eller hvis
// Origin passer til den host, requesten blev sendt til. Ellers svares 403.
function checkOrigin(req, res, next) {
  if (!METHODS_THAT_CHANGE_DATA.includes(req.method)) {
    return next();
  }

  // En request til admin skal komme fra admin-siden, og en request til hotellet
  // fra hotellets side. Så kan hotellets side heller ikke ændre noget i admin.
  let expectedOrigin = publicOrigin;
  if (isAdminHost(req)) {
    expectedOrigin = adminOrigin;
  }

  // Alle nuværende browsere sender Origin ved POST, PUT, PATCH og DELETE.
  // Mangler headeren, eller er den "null" (fx fra en sandboxed iframe), afvises requesten.
  const origin = req.get('Origin');
  if (origin !== expectedOrigin) {
    return res.status(403).json({ error: 'Requesten kom ikke fra vores egen side' });
  }

  next();
}

module.exports = checkOrigin;
