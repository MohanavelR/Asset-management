const Employee = require("../models/employee");
const logger = require("../helpers/logger");
const { Op } = require("sequelize");


const SORTABLE = ["employeeId", "name", "email", "phone", "department", "designation", "branch", "status"];

exports.employeeList = async (req, res) => {
  try {
    const draw = parseInt(req.query.draw, 10) || 1;
    const start = Math.max(parseInt(req.query.start, 10) || 0, 0);
    let length = parseInt(req.query.length, 10) || 10;
    if (length < 1) length = 10;
    if (length > 100) length = 100;
    const where = {};
    const status = String(req.query.status || "").trim();
    if (["Active", "Inactive"].includes(status)) where.status = status;

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
        { branch: { [Op.iLike]: like } },
      ];
    }

    let order = [["createdAt", "DESC"]];
    const o = req.query.order && req.query.order[0];
    if (o) {
      const colName = req.query.columns?.[o.column]?.data;
      if (SORTABLE.includes(colName)) {
        order = [[colName, o.dir === "asc" ? "ASC" : "DESC"]];
      }
    }

    const [recordsTotal, { count: recordsFiltered, rows }] = await Promise.all([
      Employee.count(),
      Employee.findAndCountAll({ where, order, limit: length, offset: start }),
    ]);

    res.json({ draw, recordsTotal, recordsFiltered, data: rows });
  } catch (err) {
    logger.error("Employee List Error:", err);
    res.status(500).json({
      draw: parseInt(req.query.draw, 10) || 1,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: "Server error",
    });
  }
};
exports.employeeView = function (req, res) {
    try {
        res.render("user/employees/employees",{activePage:"employees"})
    } catch (error) {
        logger.error("employees View Error:", error)
    }
}

exports.viewEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).render("error", {
        message: "Employee not found"
      });
    }
    return res.render("user/employees/viewEmployee", {
      employee
    });

  } catch (error) {
    next(error);
  }
};


exports.addEmployeeView = function (req, res) {
    try {
        res.render("user/employees/addEmployee",{activePage:"employees"})
    } catch (error) {
        logger.error("dashboard View Error:", error)
    }
}

exports.updateEmployeeView = async function (req, res, next) {
    try {

        const { id } = req.params;

        const employee = await Employee.findByPk(id);

        if (!employee) {
            return res.status(404).render("error", {
                message: "Employee not found"
            });
        }
   
        res.render("user/employees/addEmployee", {
            activePage: "employees",
            employee
        });

    } catch (error) {

        logger.error("Update Employee View Error:", error);

        next(error);
    }
};



exports.createEmployee = async function (req, res, next) {
  try {
    const {
      employeeId,
      name,
      email,
      phone,
      department,
      designation,
      branch,
      status
    } = req.body;

    const employee = await Employee.create({
      employeeId,
      name,
      email,
      phone,
      department,
      designation,
      branch,
      status,
      c_by:req.user.id
    });
    
    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee
    });

  } catch (error) {
    next(error);
  }
};
exports.updateEmployee = async function (req, res, next) {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    await employee.update({
      employeeId: req.body.employeeId,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      department: req.body.department,
      designation: req.body.designation,
      branch: req.body.branch,
      status: req.body.status
    });

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee
    });

  } catch (error) {
    next(error);
  }
};
exports.deleteEmployee = async function (req, res, next) {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    await employee.destroy();

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully"
    });

  } catch (error) {
    next(error);
  }
};
exports.updateEmployeeStatus = async function (req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    employee.status = status;
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Employee status updated successfully",
      data: employee
    });

  } catch (error) {
    next(error);
  }
};