const User = require("../models/user");

const createAdmin = async () => {
    try {
        const existingAdmin = await User.findOne({
            where: {
                role: "ADMIN"
            }
        });

        if (existingAdmin) {
            console.log("Admin already exists");
            return;
        }

        const admin = await User.create({
            userName: "admin",
            password: "admin@123",
            email: "admin@example.com",
            role: "ADMIN",
            isActive: true
        });

        console.log(`Admin created: ${admin.userName}`);
    } catch (error) {
        console.error("Admin creation failed:", error.message);
    }
};

module.exports = createAdmin;