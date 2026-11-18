// Formål: fejlklasse, som services kaster, når en request ikke kan gennemføres.
// Fejlen bærer den HTTP-statuskode, klienten skal have (fx 400, 404 eller 409).

// En forventet fejl med statuskode og en besked på dansk, der må vises til klienten.
class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

module.exports = { AppError };
