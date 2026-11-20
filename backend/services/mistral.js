// Formål: den eneste fil, der kender AI-udbyderen Mistral. Den sender en samtale
// til Mistrals chat-API og giver svarteksten tilbage. Resten af koden kalder
// services/ai.js og ved ikke, hvilken udbyder der bruges. Skal udbyderen skiftes,
// laves en ny fil med samme funktion (sendChat), og ai.js peges på den.
//
// Kommunikationen er en almindelig HTTPS POST-request med en JSON-body til
// api.mistral.ai, sendt med Nodes indbyggede fetch(). TLS krypterer både
// API-nøglen i Authorization-headeren og gæstens besked på vej til Mistral.
// Kaldet sker fra serveren (workeren), aldrig fra browseren, så nøglen ikke
// kan læses af brugerne.

const { config } = require('../config');

const MISTRAL_CHAT_URL = 'https://api.mistral.ai/v1/chat/completions';

// Mistrals lille, hurtige model. "latest" peger altid på den nyeste udgave.
const MISTRAL_MODEL = 'mistral-small-latest';

// Hvor længe vi venter på svar. Bliver det for lang tid, opgiver vi, så gæsten
// ikke venter forgæves, og ai.js kan give samtalen videre til personalet.
const REQUEST_TIMEOUT_MS = 15000;

// Lav temperatur giver mere ensartede svar, der holder sig til den viden,
// modellen får. Høj temperatur giver mere varierede og kreative svar.
const TEMPERATURE = 0.2;

// Henter API-nøglen og stopper med en tydelig fejl, hvis den mangler i .env.
function getApiKey() {
  if (!config.aiApiKey) {
    throw new Error('AI_API_KEY mangler i .env');
  }
  return config.aiApiKey;
}

// Laver en fejl med HTTP-statuskoden fra Mistral og en forklaring på dansk.
// Svaret fra Mistral logges ikke, fordi det kan indeholde gæstens besked.
function createHttpError(status) {
  let reason = 'uventet fejl hos Mistral';
  if (status === 401) {
    reason = 'API-nøglen er forkert eller slettet';
  } else if (status === 429) {
    reason = 'for mange kald (rate limit) eller tom konto';
  } else if (status >= 500) {
    reason = 'Mistral har en fejl lige nu';
  }
  const error = new Error(`Mistral svarede med HTTP ${status}: ${reason}`);
  error.status = status;
  return error;
}

// Sender en HTTPS POST-request til Mistral og giver HTTP-svaret tilbage.
// AbortSignal.timeout afbryder requesten, hvis Mistral ikke svarer i tide.
async function postToMistral(body) {
  try {
    return await fetch(MISTRAL_CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new Error(`Mistral svarede ikke inden for ${REQUEST_TIMEOUT_MS / 1000} sekunder`);
    }
    // Fx ingen internetforbindelse, DNS-opslaget fejlede, eller TLS-handshaket mislykkedes
    throw new Error(`Kunne ikke forbinde til Mistral: ${err.message}`);
  }
}

// Sender en samtale til Mistral og beder om et svar som JSON-objekt.
// messages er en liste af { role, content }, hvor role er 'system' (instrukser
// til modellen), 'user' (gæsten) eller 'assistant' (tidligere AI-svar).
// Systembeskeden skal nævne JSON, ellers afviser Mistral JSON-tilstanden.
// Giver { text, model, inputTokens, outputTokens } tilbage. Kaster en fejl ved
// manglende nøgle, timeout, netværksfejl eller en HTTP-fejl fra Mistral.
async function sendChat(messages) {
  const body = {
    model: MISTRAL_MODEL,
    messages: messages,
    temperature: TEMPERATURE,
    // JSON-tilstand: Mistral garanterer, at svaret er gyldig JSON.
    // Om felterne er de rigtige, tjekker ai.js selv.
    response_format: { type: 'json_object' },
  };

  const response = await postToMistral(body);
  if (!response.ok) {
    throw createHttpError(response.status);
  }

  const data = await response.json();
  const choice = data.choices && data.choices[0];
  if (!choice || !choice.message || typeof choice.message.content !== 'string') {
    throw new Error('Svaret fra Mistral havde ikke den forventede form');
  }

  // Antal tokens bruges til at følge forbruget og prisen pr. kald.
  const usage = data.usage || {};
  return {
    text: choice.message.content,
    model: data.model,
    inputTokens: usage.prompt_tokens,
    outputTokens: usage.completion_tokens,
  };
}

module.exports = { sendChat };
