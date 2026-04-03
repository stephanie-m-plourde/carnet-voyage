const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(paramName = 'id') {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!UUID_RE.test(value)) {
      return res.status(400).json({ error: `Paramètre '${paramName}' invalide.` });
    }
    next();
  };
}

module.exports = { validateUUID };
