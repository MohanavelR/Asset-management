function guestMiddleware(req, res, next) {
    if (req.isAuthenticated) {
        console.log("ejnrfirntf")
        return res.redirect("/dashboard");
    }

    next();
}

module.exports = guestMiddleware;