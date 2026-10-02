exports.dashboardView = function (req, res) {
    try {
        res.render("user/dashboard",{activePage:"dashboard"})
    } catch (error) {
        logger.error("dashboard View Error:", error)
    }
}