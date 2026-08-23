const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Prohibido. Se requieren permisos de administrador.' });
  }
  next();
};

module.exports = requireAdmin;
