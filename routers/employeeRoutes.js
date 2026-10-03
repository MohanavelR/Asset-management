const { addEmployeeView, createEmployee, updateEmployee, updateEmployeeStatus, deleteEmployee, employeeView, employeeList, viewEmployee, updateEmployeeView } = require("../controllers/employee");
const apiAuthMiddleware = require("../middleware/apiMiddleware");
const pageAuthMiddleware = require("../middleware/pageMiddleware");
const { employeeValidation } = require("../middleware/validationMiddleware");

const router=require("express").Router()
router.get("/employees",pageAuthMiddleware,employeeView);
router.get("/employees/add",pageAuthMiddleware,addEmployeeView);
router.get("/employee/view/:id", viewEmployee);
router.get("/employees/update/:id", updateEmployeeView);

router.get("/employeesApi",apiAuthMiddleware,employeeList);
router.post("/addEmployeeApi",employeeValidation,createEmployee);
router.put("/updateEmployeeApi/:id",employeeValidation,updateEmployee);
router.delete("/deleteEmployeeApi/:id",deleteEmployee);
// router.patch("/updateEmployeeStatusApi/:id",updateEmployeeStatus);
// // Get all
// router.get("/getEmployeesApi",employeeController.getEmployees);
module.exports=router