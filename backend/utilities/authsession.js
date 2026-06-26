function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session?.admin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userRole = req.session.admin?.role;
    if (!userRole) return res.status(403).json({ error: "Forbidden" });

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}

module.exports = {
  requireRole
};