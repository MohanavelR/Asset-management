const { isEmpty,isValidEmail,isValidPhone,cleanString ,isValidDate,formatDate} = require("../helpers/validation");
const dayjs = require("dayjs");
const { RETURN_REASONS } = require("../models/issueAsset");
const { SCRAP_REASONS } = require("../models/asset");
const logger = require("../helpers/logger");

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

// ======================= ASSET =======================
const STATUSES = ["In Stock", "Issued", "Repair", "Scrapped"];
const OPTIONAL_DATES = [
  "issuedDate", "returnDate", "scrappedDate",
  "warrantyStartDate", "warrantyEndDate",
];

const assetValidation = function (req, res, next) {
  try {
    const {
       serial_no, category, make, model,
      acqDate, acqPrice, vendor, branch, status,
      specifications, assignedTo,
    } = req.body;

    const errors = [];

    

    // ---------- Required text ----------
    if (isEmpty(serial_no)) {
      errors.push({ field: "serial_no", message: "Serial number is required" });
    }

    const requiredText = { make, model, vendor, branch };
    for (const [field, value] of Object.entries(requiredText)) {
      if (isEmpty(value)) {
        errors.push({ field, message: `${field} is required` });
      } 
    }

    // ---------- Category ----------
    if (isEmpty(category)) {
      errors.push({ field: "category", message: "Category is required" });
    } else if (!Number.isInteger(Number(category)) || Number(category) < 1) {
      errors.push({ field: "category", message: "Please select a valid category" });
    }

    // ---------- Price ----------
    if (isEmpty(acqPrice)) {
      errors.push({ field: "acqPrice", message: "Acquisition price is required" });
    } else if (isNaN(Number(acqPrice)) || Number(acqPrice) < 0) {
      errors.push({ field: "acqPrice", message: "Price must be a number, 0 or more" });
    }


    const cleanStatus = isEmpty(status) ? null : cleanString(String(status));
    if (cleanStatus && !STATUSES.includes(cleanStatus)) {
      errors.push({ field: "status", message: `Status must be one of: ${STATUSES.join(", ")}` });
    }

    let assigned = null;
    if (!isEmpty(assignedTo)) {
      if (!Number.isInteger(Number(assignedTo)) || Number(assignedTo) < 1) {
        errors.push({ field: "assignedTo", message: "Please select a valid employee" });
      } else {
        assigned = Number(assignedTo);
      }
    }

    // ---------- Acquisition date (required) ----------
    let acq = null;
    if (isEmpty(acqDate)) {
      errors.push({ field: "acqDate", message: "Acquisition date is required" });
    } else if (!isValidDate(String(acqDate))) {
      errors.push({ field: "acqDate", message: "Please enter a valid date" });
    } else {
      acq = formatDate(acqDate, 1); // YYYY-MM-DD
    }

    // ---------- Optional dates ----------
    const d = {}; // cleaned values, null when empty
    for (const field of OPTIONAL_DATES) {
      const value = req.body[field];
      if (isEmpty(value)) {
        d[field] = null;
      } else if (!isValidDate(String(value))) {
        errors.push({ field, message: "Please enter a valid date" });
        d[field] = null;
      } else {
        d[field] = formatDate(value, 1);
      }
    }

    // ---------- Rules between fields ----------
    if (cleanStatus === "Issued") {
      if (!d.issuedDate && isEmpty(req.body.issuedDate)) {
        errors.push({ field: "issuedDate", message: "Issued date is required when status is Issued" });
      }
      if (!assigned && isEmpty(assignedTo)) {
        errors.push({ field: "assignedTo", message: "Assigned employee is required when status is Issued" });
      }
    }
    if (cleanStatus === "Scrapped" && !d.scrappedDate && isEmpty(req.body.scrappedDate)) {
      errors.push({ field: "scrappedDate", message: "Scrapped date is required when status is Scrapped" });
    }
    

    // ---------- Optional text ----------
    if (!isEmpty(specifications) && typeof specifications !== "string") {
      errors.push({ field: "specifications", message: "Specifications must be text" });
    }

    // ---------- Stop if any error ----------
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
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

    req.body.assignedTo = assigned; 
    for (const field of OPTIONAL_DATES) {
      req.body[field] = d[field];  
    }
    req.body.specifications = isEmpty(specifications) ? null : cleanString(specifications);

    next();
  } catch (error) {
    next(error);
  }
};




const toId = (value) => {
  if (typeof value !== "string" && typeof value !== "number") return null;
  if (isEmpty(value)) return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : null;
};

const issueValidation = function (req, res, next) {
  logger.debug(dayjs().format("YYYY-MM-DD"))
  logger.debug(req.body.issuedDate)
  try {
    const { assetId, employeeId, issuedDate, remarks } = req.body;
    const errors = [];

    // ---------- Asset ----------
    const asset = toId(assetId);
    if (!asset) {
      errors.push({ field: "assetId", message: "Please select an asset" });
    }

    // ---------- Employee ----------
    const employee = toId(employeeId);
    if (!employee) {
      errors.push({ field: "employeeId", message: "Please select an employee" });
    }

    // ---------- Issue date (empty means today) ----------
    const todayStr = dayjs().format("YYYY-MM-DD");
    let date = todayStr;
    if (!isEmpty(issuedDate)) {
      if (!isValidDate(String(issuedDate))) {
        errors.push({ field: "issuedDate", message: "Please enter a valid date" });
      } else {
        date = formatDate(issuedDate, 1);
        
        if (date > todayStr) {
          errors.push({ field: "issuedDate", message: "Issue date cannot be in the future" });
        }
      }
    }

    // ---------- Remarks (optional) ----------
    if (!isEmpty(remarks)) {
      if (typeof remarks !== "string") {
        errors.push({ field: "remarks", message: "Remarks must be text" });
      } else if (cleanString(remarks).length > 500) {
        errors.push({ field: "remarks", message: "Remarks must be at most 500 characters" });
      }
    }

    // ---------- Stop if any error ----------
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    // ---------- Clean values for the controller ----------
    req.body.assetId = asset;
    req.body.employeeId = employee;
    req.body.issuedDate = date;
    req.body.remarks = isEmpty(remarks) ? null : cleanString(remarks);

    next();
  } catch (error) {
    next(error);
  }
};


const returnValidation = function (req, res, next) {
  try {
    const { assetId, reason, returnDate, remarks } = req.body;
    const errors = [];
    const todayStr = dayjs().format("YYYY-MM-DD");

    const asset = toId(assetId);
    if (!asset) errors.push({ field: "assetId", message: "Please select an asset" });

    const cleanReason = isEmpty(reason) ? "" : cleanString(reason);
    if (!cleanReason) {
      errors.push({ field: "reason", message: "Reason for return is required" });
    } else if (!RETURN_REASONS.includes(cleanReason)) {
      errors.push({ field: "reason", message: "Reason must be one of: " + RETURN_REASONS.join(", ") });
    } else if (cleanReason === "Other" && isEmpty(remarks)) {
      errors.push({ field: "remarks", message: "Please explain the reason in remarks" });
    }

    let date = todayStr; // empty means today
    if (!isEmpty(returnDate)) {
      if (!isValidDate(String(returnDate))) {
        errors.push({ field: "returnDate", message: "Please enter a valid date" });
      } else {
        date = formatDate(returnDate, 1);
        if (date > todayStr) {
          errors.push({ field: "returnDate", message: "Return date cannot be in the future" });
        }
      }
    }

    if (!isEmpty(remarks)) {
      if (typeof remarks !== "string") {
        errors.push({ field: "remarks", message: "Remarks must be text" });
      } else if (cleanString(remarks).length > 500) {
        errors.push({ field: "remarks", message: "Remarks must be at most 500 characters" });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    req.body.assetId = asset;
    req.body.reason = cleanReason;
    req.body.returnDate = date;
    
    req.body.remarks = isEmpty(remarks) ? null : cleanString(remarks);
    next();
  } catch (error) {
    next(error);
  }
};


const scrapValidation = function (req, res, next) {
  try {
    const { assetId, reason, scrappedDate, remarks } = req.body;
    const errors = [];
    const todayStr = dayjs().format("YYYY-MM-DD");

    const asset = toId(assetId);
    if (!asset) errors.push({ field: "assetId", message: "Please select an asset" });

    const cleanReason = isEmpty(reason) ? "" : cleanString(reason);
    if (!cleanReason) {
      errors.push({ field: "reason", message: "Reason for scrapping is required" });
    } else if (!SCRAP_REASONS.includes(cleanReason)) {
      errors.push({ field: "reason", message: "Reason must be one of: " + SCRAP_REASONS.join(", ") });
    } else if (cleanReason === "Other" && isEmpty(remarks)) {
      errors.push({ field: "remarks", message: "Please explain the reason in remarks" });
    }

    let date = todayStr; // empty means today
    if (!isEmpty(scrappedDate)) {
      if (!isValidDate(String(scrappedDate))) {
        errors.push({ field: "scrappedDate", message: "Please enter a valid date" });
      } else {
        date = formatDate(scrappedDate, 1);
        if (date > todayStr) {
          errors.push({ field: "scrappedDate", message: "Scrapped date cannot be in the future" });
        }
      }
    }

    if (!isEmpty(remarks)) {
      if (typeof remarks !== "string") {
        errors.push({ field: "remarks", message: "Remarks must be text" });
      } else if (cleanString(remarks).length > 500) {
        errors.push({ field: "remarks", message: "Remarks must be at most 500 characters" });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }

    req.body.assetId = asset;
    req.body.reason = cleanReason;
    req.body.scrappedDate = date;
    req.body.remarks = isEmpty(remarks) ? null : cleanString(remarks);
    next();
  } catch (error) {
    next(error);
  }
};




module.exports = {returnValidation,scrapValidation ,employeeValidation, assetCategoryValidation, assetValidation,issueValidation };
