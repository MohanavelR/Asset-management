const { isEmpty,isValidEmail,isValidPhone,cleanString } = require("../helpers/validation");

const employeeValidation=function(req,res,next){
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

    const errors=[]

    if(isEmpty(employeeId)){
        errors.push({field:"employee ID",message:"Employee ID"})
    }
    if (isEmpty(name)) {
        errors.push({field: "name",message: "Name is required"})
    }
    if (isEmpty(email)) {
        errors.push({field: "email", message: "Email is required"})
    }
    if (!isEmpty(email) && !isValidEmail(email)) {
        errors.push({field: "email",message: "Please enter a valid email"});
    }
    
    if (isEmpty(phone)) {
        errors.push({field: "phone",message: "Phone is required"});
    }
    
    if (!isEmpty(phone) && !isValidPhone(phone)) {
        errors.push({field: "phone",message: "Please enter a valid phone number"})
    }
    
    if (isEmpty(department)) {
        errors.push({field: "department",message: "Department is required"})
    }
    
    if (isEmpty(designation)) {
        errors.push({field: "designation",message: "Designation is required"})
    }
    
    if (isEmpty(branch)) {
        errors.push({field: "branch",message: "Branch is required"});
    }
    
    if (!isEmpty(status) && !["Active", "Inactive"].includes(cleanString(status))) {
        errors.push({field: "status",message: "Invalid status"});
    }

    if (errors.length >0){
        return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors
      });
    }

    req.body.employeeId = cleanString(employeeId);
    req.body.name = cleanString(name);
    req.body.email = cleanString(email);
    req.body.phone = cleanString(phone);
    req.body.department = cleanString(department);
    req.body.designation = cleanString(designation);
    req.body.branch = cleanString(branch);

    if (!isEmpty(status)) {
      req.body.status = cleanString(status);
    }
    next()

 } catch (error) {
     next(error);
 }
}

module.exports={employeeValidation}