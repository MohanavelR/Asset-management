const { addEmployeeView, createEmployee, updateEmployee, updateEmployeeStatus, deleteEmployee } = require("../controllers/employee");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const { employeeValidation } = require("../middleware/validationMiddleware");

const router=require("express").Router()

router.get("/employees/add",pageAuthMiddleware,addEmployeeView);
router.post("/addEmployeeApi",employeeValidation,createEmployee);
router.put("/updateEmployeeApi/:id",employeeValidation,updateEmployee);
router.delete("/deleteEmployeeApi/:id",deleteEmployee);
// router.patch("/updateEmployeeStatusApi/:id",updateEmployeeStatus);
// // Get all
// router.get("/getEmployeesApi",employeeController.getEmployees);
