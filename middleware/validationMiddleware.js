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

const assetCategoryValidation = function (req, res, next) {
  try {
    const {name,desc} = req.body;

    const errors = [];
    const cleanName=isEmpty(name)

    if (cleanName) {
      errors.push({ field: "name", message: "Category name is required" });
    } 
    if (isEmpty(cleanName) && (cleanName.length < 2 || cleanName.length > 100)) {
      errors.push({field: "name",message: "Category name must be 2-100 characters"})
    }
    if (!isEmpty(desc) && typeof desc !== "string") {
      errors.push({ field: "desc", message: "Description must be text" });
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    req.body.name = cleanString(name);
    if (!isEmpty(desc)) {
      req.body.desc = cleanString(desc);
    }

    next();
  } catch (error) {
    next(error);
  }
};


const STATUSES = ["In Stock", "Issued", "Repair", "Scrapped"];

const assetValidation = function (req, res, next) {
  try {
    const {
       serial_no, category, make, model,
      acqDate, acqPrice, vendor, branch, status,
      issuedDate, returnDate, scrappedDate,
      specifications,
    } = req.body;

    const errors = [];
    if (isEmpty(serial_no)) {
      errors.push({ field: "serial_no", message: "Serial number is required" });
    }
    const requiredText = { make, model, vendor, branch };
    for (const [field, value] of Object.entries(requiredText)) {
      if (isEmpty(value)) {
        errors.push({ field, message: `${field} is required` });
      } 
    }
    // --
    if (isEmpty(category)) {
      errors.push({ field: "category", message: "Category is required" });
    } else if (!Number.isInteger(Number(category)) || Number(category) < 1) {
      errors.push({ field: "category", message: "Please select a valid category" });
    }
    // --
    if (isEmpty(acqPrice)) {
      errors.push({ field: "acqPrice", message: "Acquisition price is required" });
    } else if (isNaN(Number(acqPrice)) || Number(acqPrice) < 0) {
      errors.push({ field: "acqPrice", message: "Price must be a number, 0 or more" });
    } 
    // --
    const cleanStatus = isEmpty(status) ? null : cleanString(String(status));
    if (cleanStatus && !STATUSES.includes(cleanStatus)) {
      errors.push({ field: "status", message: `Status must be one of: ${STATUSES.join(", ")}` });
    }

    // --

    let acq = null;
    if (isEmpty(acqDate)) {
      errors.push({ field: "acqDate", message: "Acquisition date is required" });
    } else if (!isValidDate(String(acqDate))) {
      errors.push({ field: "acqDate", message: "Please enter a valid date" });
    } else {
        acq = formatDate(acqDate, 1)
    }

   
    const optional = { issuedDate, returnDate, scrappedDate };
    const cleanDates = {};
    for (const [field, value] of Object.entries(optional)) {
      if (isEmpty(value)) continue;
      if (!isValidDate(String(value))) {
        errors.push({ field, message: "Please enter a valid date" });
      } else {
        cleanDates[field] = formatDate(value, 1);
      }
    }

    // --
    if (cleanStatus === "Issued" && !cleanDates.issuedDate && isEmpty(issuedDate)) {
      errors.push({ field: "issuedDate", message: "Issued date is required when status is Issued" });
    }
    if (cleanStatus === "Scrapped" && !cleanDates.scrappedDate && isEmpty(scrappedDate)) {
      errors.push({ field: "scrappedDate", message: "Scrapped date is required when status is Scrapped" });
    }
    if (acq && cleanDates.issuedDate && cleanDates.issuedDate < acq) {
      errors.push({ field: "issuedDate", message: "Issued date cannot be before acquisition date" });
    }
    if (cleanDates.issuedDate && cleanDates.returnDate && cleanDates.returnDate < cleanDates.issuedDate) {
      errors.push({ field: "returnDate", message: "Return date cannot be before issued date" });
    }


    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }
    req.body.serial_no = cleanString(String(serial_no));
    req.body.category = Number(category);
    req.body.make = cleanString(String(make));
    req.body.model = cleanString(String(model));
    req.body.acqDate = acq;             
    req.body.acqPrice = Number(acqPrice);
    req.body.vendor = cleanString(String(vendor));
    req.body.branch = cleanString(String(branch));

    if (cleanStatus) req.body.status = cleanStatus;
    if (cleanDates.issuedDate) req.body.issuedDate = cleanDates.issuedDate;
    if (cleanDates.returnDate) req.body.returnDate = cleanDates.returnDate;
    if (cleanDates.scrappedDate) req.body.scrappedDate = cleanDates.scrappedDate;
    if (!isEmpty(specifications)) req.body.specifications = cleanString(specifications);
    next();
  } catch (error) {
    next(error);
  }
};
module.exports={employeeValidation,assetCategoryValidation,assetValidation}