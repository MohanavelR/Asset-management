function adminPageAuthMiddleware(req, res, next) {
  if (!req.isAuthenticated) {
    return res.redirect("/login");
  }
  if (req.user.role !== "ADMIN") {
    return res.redirect("/dashboard");
  }
  next();
}

module.exports = adminPageAuthMiddleware;