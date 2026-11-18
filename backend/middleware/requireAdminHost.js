// Formål: adskiller hotellets webapp og admin. Admin ligger på sit eget
// subdomæne (admin.<domæne>, lokalt admin.localhost), så gæstens og personalets
// cookies aldrig sendes til den forkerte host.

// Afgør ud fra Host-headeren, om requesten kom ind via admin-subdomænet.
function isAdminHost(req) {
  return req.hostname.startsWith('admin.');
}

// Middleware til admin-ruter: afviser requests, der ikke kom via admin-subdomænet.
function requireAdminHost(req, res, next) {
  if (!isAdminHost(req)) {
    return res.status(403).json({ error: 'Ingen adgang' });
  }
  next();
}

module.exports = { isAdminHost, requireAdminHost };
