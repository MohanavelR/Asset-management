const dayjs = require("dayjs");
const { Op, fn, col } = require("sequelize");
const {AssetCategory,Employee,Asset,AssetHistory,User} =require("../models/index")
const { sequelize } = require("../config/db");
const logger = require("../helpers/logger");

// ========= Dashboard View ===========
exports.dashboardView = async function (req, res, next) {
  try {
    const todayStr = dayjs().format("YYYY-MM-DD");
    const in30 = dayjs().add(30, "day").format("YYYY-MM-DD");

    const [
      statusRows,
      branchRows,
      categoryRows,
      categories,
      activeEmployees,
      recent,
    ] = await Promise.all([
      Asset.unscoped().findAll({
        attributes: [
          "status",
          [fn("COUNT", col("id")), "total"],
        ],
        group: ["status"],
        raw: true,
      }),
      Asset.findAll({
        attributes: [
          "branch",
          [fn("COUNT", col("id")), "total"],
          [fn("COALESCE", fn("SUM", col("acqPrice")), 0), "value"],
        ],
        where: { status: "In Stock" },
        group: ["branch"],
        order: [["branch", "ASC"]],
        raw: true,
      }),
      Asset.findAll({
        attributes: ["category", [fn("COUNT", col("id")), "total"]],
        group: ["category"],
        raw: true,
      }),
      AssetCategory.findAll({ attributes: ["id", "name"], raw: true }),
      Employee.count({ where: { status: "Active" } }),
      AssetHistory.findAll({
        include: [
          { model: Asset.unscoped(), as: "asset", attributes: ["id", "assetTag", "make", "model"], required: true },
          { model: Employee, as: "employee", attributes: ["id", "name"], required: false },
        ],
        order: [["actionDate", "DESC"], ["id", "DESC"]],
        limit: 8,
      }),
    ]);

    const stat = { "In Stock": 0, "Issued": 0, "Returned": 0, "Scrapped": 0 };
    const val = { "In Stock": 0, "Issued": 0, "Returned": 0, "Scrapped": 0 };

    statusRows.forEach((r) => {
      stat[r.status] = Number(r.total);
      val[r.status] = Number(r.value);
    });

    const activeCount = stat["In Stock"] + stat["Issued"] + stat["Returned"];
   
    const nameOf = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const byCategory = categoryRows
      .map((r) => ({ name: nameOf[r.category] || "-", total: Number(r.total) }))
      .sort((a, b) => b.total - a.total);

    res.render("user/dashboard", {
      activePage: "dashboard",
      stat,
      val,
      activeCount,
      activeEmployees,
      branches: branchRows.map((b) => ({ branch: b.branch, total: Number(b.total), value: Number(b.value) })),
      byCategory,
      maxCategory: byCategory.length ? byCategory[0].total : 1,
      recent: recent.map((r) => r.get({ plain: true })),
    });
  } catch (error) {
    logger.error(`Dashboard error: ${error}`);
    res.render("error", { error });
  }
};

// ============ User Management Page ===========
exports.userManageView = async (req, res) => {
  try {
    res.render("admin/userManage",{ activePage: "userManage"});
  } catch (error) {
    logger.error(`User manage view error: ${error}`);
    res.render("error", { error });
  }
};

// ========== User Management Api============

exports.userManageList = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw, 10) || 1;
    const start = Math.max(parseInt(req.query.start, 10) || 0, 0);
    let length = parseInt(req.query.length, 10) || 10;
    if (length < 1) length = 10;
    if (length > 100) length = 100;

    // only active employees
    const where = { status: "Active" };

    // branch filter
    const branch = String(req.query.branch || "").trim();
    if (branch) where.branch = branch;

    // search box (employee details)
    const q = String(req.query.query || "").trim();
    if (q) {
      const like = `%${q}%`;
      where[Op.or] = [
        { employeeId: { [Op.iLike]: like } },
        { name: { [Op.iLike]: like } },
        { email: { [Op.iLike]: like } },
        { phone: { [Op.iLike]: like } },
        { department: { [Op.iLike]: like } },
        { designation: { [Op.iLike]: like } },
      ];
    }

    // user status filter: Active | Inactive | NotCreated
    const userStatus = String(req.query.userStatus || "").trim();
    const userInclude = {
      model: User,
      as: "user",
      attributes: ["id", "userName", "role", "isActive"], // no password
      required: false,
    };

    if (userStatus === "NotCreated") {
      where.userId = null;
    } else if (userStatus === "Active") {
      userInclude.required = true;
      userInclude.where = { isActive: true };
    } else if (userStatus === "Inactive") {
      userInclude.required = true;
      userInclude.where = { isActive: false };
    }

    const [recordsTotal, { count: recordsFiltered, rows }] = await Promise.all([
      Employee.count({ where: { status: "Active" } }),
      Employee.findAndCountAll({
        where,
        include: [userInclude],
        order: [["createdAt", "DESC"]],
        limit: length,
        offset: start,
      }),
    ]);

    // ============ set status =============
    const data = rows.map((emp) => {
      const row = emp.toJSON();
      row.userCreated = !!row.userId;
      row.userStatus = row.user ? (row.user.isActive ? "Active" : "Inactive") : "Not Created";
      return row;
    });

    res.json({ draw, recordsTotal, recordsFiltered, data });
  } catch (err) {
    logger.error(`User manage list error: ${err}`);
    res.status(500).json({
      draw: parseInt(req.query.draw, 10) || 1,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: "Server error",
    });
  }
};

// =========== Update user Status ===========

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: "You cannot change your own status" 
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
      data: { id: user.id, isActive: user.isActive },
    });
  } catch (err) {
    logger.error(`User status toggle error: ${err}`);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// =========== Create User ============
exports.createUser = async (req, res, next) => {
  try {
    const employeeId = req.body.employeeId;
    const userName = String(req.body.userName || "").trim();
    const password = String(req.body.password || "");
    const role = String(req.body.role || "").trim();

    if (!employeeId || !userName || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!["ADMIN", "EMPLOYEE", "MANAGER"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role",
      });
    }

    const failed = await sequelize.transaction(async (t) => {
      
      const employee = await Employee.findByPk(employeeId, { transaction: t });
      if (!employee) {
        return { code: 404, message: "Employee not found" };
      }

      
      if (employee.status !== "Active") {
        return { code: 400, message: "Employee is not active" };
      }

      
      if (employee.userId) {
        return { code: 400, message: "User already created for this employee" };
      }

     
      const nameExists = await User.findOne({
        where: { userName },
        transaction: t,
      });
      if (nameExists) {
        return { code: 400, message: "User name already exists" };
      }

      
      const emailExists = await User.findOne({
        where: { email: employee.email },
        transaction: t,
      });
      if (emailExists) {
        return { code: 400, message: "A user with this employee email already exists" };
      }

      
      const user = await User.create(
        {
          userName,
          password,
          email: employee.email,
          role,
          c_by: req.user.id,
        },
        { transaction: t }
      );

     
      employee.userId = user.id;
      await employee.save({ transaction: t });

      return null;
    });

    if (failed) {
      return res.status(failed.code).json({
        success: false,
        message: failed.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ============ Change Current User Password ===========


exports.changePassword = async (req, res, next) => {
  try {
    const oldPassword = String(req.body.oldPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from old password",
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await user.isMatchPassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};


