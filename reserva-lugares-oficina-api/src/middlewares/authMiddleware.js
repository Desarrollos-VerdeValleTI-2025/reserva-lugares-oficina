const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/discovery/v2.0/keys`,
});

const getSigningKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authorization header is missing or invalid.'
      }
    });
  }
  
  const token = authHeader.substring(7);

  // Normaliza el Client ID (por si en .env quedó con o sin el prefijo "api://") y acepta
  // ambas formas como audiencia válida: los tokens emitidos contra un scope de "Expose an API"
  // traen el App ID URI completo (api://<client-id>), no el GUID pelón.
  const clientId = (process.env.AZURE_AD_CLIENT_ID || '').replace(/^api:\/\//, '');

  jwt.verify(token, getSigningKey, {
    audience: [clientId, `api://${clientId}`],
    // Acepta tanto el emisor v2.0 como el v1.0 (sts.windows.net) — depende de cómo esté
    // configurado el "Accepted token version" del App Registration del API, no de quién pide el token.
    issuer: [
      `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      `https://sts.windows.net/${process.env.AZURE_AD_TENANT_ID}/`,
    ],
    algorithms: ['RS256']
  }, (err, decoded) => {
    if (err) {
      console.log('DEBUG jwt.verify error ->', err.name, '-', err.message);
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token inválido o expirado.'
        }
      });
    }
    // preferred_username es el claim típico en tokens v2.0; upn/unique_name son sus equivalentes en v1.0
    req.user = { email: decoded.preferred_username || decoded.upn || decoded.unique_name || decoded.email };
    next();
  });
};

module.exports = authMiddleware;