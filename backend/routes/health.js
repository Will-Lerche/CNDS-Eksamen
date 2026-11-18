// Formål: endpoint til ping- og oppetidstests. Svarer hurtigt uden at røre
// databasen, så målinger af svartid viser selve HTTP-turen gennem Nginx og Node.

const express = require('express');

const router = express.Router();

// GET /api/health – bekræfter, at serveren kører, og hvor længe den har kørt.
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    uptime_seconds: Math.round(process.uptime()),
  });
});

module.exports = router;
