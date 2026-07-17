function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session?.admin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = String(req.session.admin?.role || '').trim().toLowerCase();
    if (!userRole) return res.status(403).json({ error: "Forbidden" });

    const allowedRoles = roles.map(role => String(role).trim().toLowerCase());
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

module.exports = {
  requireRole
};
