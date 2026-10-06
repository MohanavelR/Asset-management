const express = require("express");
const {
  addEmployeeView,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  employeeView,
  employeeList,
  viewEmployee,
  updateEmployeeView,
} = require("../controllers/employee");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const { employeeValidation } = require("../middleware/validationMiddleware");

const router = express.Router();

// ========= Page Routes ===========
router.get("/employees", pageAuthMiddleware, employeeView);
router.get("/employees/add", pageAuthMiddleware, addEmployeeView);
router.get("/employee/view/:id", pageAuthMiddleware, viewEmployee);
router.get("/employees/update/:id", pageAuthMiddleware, updateEmployeeView);

// ========= API Routes ===========
router.get("/employeesApi", apiAuthMiddleware, employeeList);
router.post("/addEmployeeApi", apiAuthMiddleware, employeeValidation, createEmployee);
router.put("/updateEmployeeApi/:id", apiAuthMiddleware, employeeValidation, updateEmployee);
router.delete("/deleteEmployeeApi/:id", apiAuthMiddleware, deleteEmployee);

module.exports = router;