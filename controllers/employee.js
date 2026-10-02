const Employee = require("../models/employee");
const logger = require("../helpers/logger");

exports.addEmployeeView = function (req, res) {
    try {
        res.render("user/employees/addEmployee",{activePage:"dashboard"})
    } catch (error) {
        logger.error("dashboard View Error:", error)
    }
}
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