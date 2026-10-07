function adminApiAuthMiddleware(req, res, next) {
    if (!req.isAuthenticated) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }
    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Access denied"
        });
    }
    next();
}
module.exports = adminApiAuthMiddleware;