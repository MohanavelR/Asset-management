const logger = require("./logger");

const apiErrorHandler =function (err, req, res, next)  {
  logger.error(err)
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Duplicate entry",
      errors: err.errors.map((e) => ({
        field: e.path,
        message: `${e.path} already exists`,
      })),
    });
  }

if (err.name === "SequelizeForeignKeyConstraintError") {
  const detail = err.parent?.detail || "";
  const inUse = detail.includes("is still referenced");
  return res.status(409).json({
    success: false,
    message: inUse ? "Cannot delete" : "Invalid reference",
    errors: [{
      message: inUse
        ? "This record is in use by existing records"
        : "Referenced record does not exist",
    }],
  });
}

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
};

module.exports=apiErrorHandler;
