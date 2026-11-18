// Formål: middleware, der svarer 404, når ingen route eller statisk fil
// matchede requesten. Skal ligge efter alle ruter i app.js.

// Svarer med HTTP-statuskode 404 Not Found og en fejl i JSON.
function notFound(req, res) {
  res.status(404).json({ error: 'Siden eller ressourcen findes ikke' });
}

module.exports = notFound;
