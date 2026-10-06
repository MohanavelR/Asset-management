const {Employee} =require("../models/index")
const logger = require("../helpers/logger");
const { Op } = require("sequelize");
const generateId = require("../helpers/generateId");

// ========= Employee Table API ===========
exports.employeeList = async (req, res) => {
  try {
   
    const draw = parseInt(req.query.draw, 10) || 1;
    const start = Math.max(parseInt(req.query.start, 10) || 0, 0);
    const {  branch } = req.query;
    let length = parseInt(req.query.length, 10) || 10;
    if (length < 1) length = 10;
    if (length > 100) length = 100;

    const where = {};
    if(branch){
       where.branch=branch
    }
   
    // status filter
    const status = String(req.query.status || "").trim();
    if (["Active", "Inactive"].includes(status)) where.status = status;

    // search box
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

    // sorting
    let order = [["createdAt", "DESC"]];
    
    const [recordsTotal, { count: recordsFiltered, rows }] = await Promise.all([
      Employee.count(),
      Employee.findAndCountAll({ where, order, limit: length, offset: start }),
    ]);

    res.json({ draw, recordsTotal, recordsFiltered, data: rows });
  } catch (err) {
    logger.error(`Employee list error: ${err}`);
    res.status(500).json({
      draw: parseInt(req.query.draw, 10) || 1,
      recordsTotal: 0,
      recordsFiltered: 0,
      data: [],
      error: "Server error",
    });
  }
};

// ========= Employee List Page ===========
exports.employeeView = function (req, res) {
  try {
    res.render("user/employees/employees", {
      activePage: "employees",
    });
  } catch (error) {
    logger.error(`Employees view error: ${error}`);
    res.render("error", { error });
  }
};

// ========= View Employee Page  ===========
exports.viewEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.render("error", { error: { message: "Employee Not Found" } });
    }

    return res.render("user/employees/viewEmployee", {
      employee,
    });
  } catch (error) {
    logger.error(`View employee error: ${error}`);
    res.render("error", { error });
  }
};

// ========= Add Employee Page ===========
exports.addEmployeeView = async function (req, res) {
  try {
    //  employee id generate 
    const last = await Employee.findOne({
      order: [["employeeId", "DESC"]],
      attributes: ["employeeId"],
      paranoid: false,
    });
    const lastId = last ? last.employeeId : null;
    const employeeId = generateId("EMP", lastId);

    res.render("user/employees/addEmployee", {
      activePage: "employees",
      employeeId,
    });
  } catch (error) {
    logger.error(`Add employee view error: ${error}`);
    res.render("error", { error });
  }
};

// ========= Update Employee Page ===========
exports.updateEmployeeView = async function (req, res, next) {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.render("error", { error: { message: "Employee Not Found" } });
    }

    res.render("user/employees/addEmployee", {
      activePage: "employees",
      employee,
      employeeId: employee.employeeId,
    });
  } catch (error) {
    logger.error(`Update employee view error: ${error}`);
    res.render("error", { error });
  }
};

// ========= Create Employee ===========
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
      status,
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
      c_by: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// ========= Update Employee ===========
exports.updateEmployee = async function (req, res, next) {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
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
      status: req.body.status,
    });

    return res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// ========= Delete Employee  ===========
exports.deleteEmployee = async function (req, res, next) {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    await employee.destroy();

    return res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

