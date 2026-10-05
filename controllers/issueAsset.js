// controllers/assetOps.js
const dayjs = require("dayjs");
const { Op } = require("sequelize");
const Asset = require("../models/asset");
const Employee = require("../models/employee");
const logger = require("../helpers/logger");
const AssetCategory = require("../models/assetCategory");
const AssetIssue = require("../models/issueAsset");
const { sequelize } = require("../config/db");
const { logHistory } = require("../helpers/logHistory");
AssetIssue.belongsTo(Asset, { foreignKey: "assetId", as: "asset" });
Asset.hasMany(AssetIssue, { foreignKey: "assetId", as: "issues" });

AssetIssue.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
Employee.hasMany(AssetIssue, { foreignKey: "employeeId", as: "issues" });

exports.issueAssetView = async function (req, res, next) {
  try {
    const [assets, employees, categories] = await Promise.all([
      Asset.findAll({
        attributes: ["id", "assetTag", "make", "model", "serial_no", "branch"],
        where: { status: "In Stock" },
        order: [["assetTag", "ASC"]],
        raw: true,
      }),
      Employee.findAll({
        attributes: ["id", "employeeId", "name", "department"],
        where: { status: "Active" },
        order: [["name", "ASC"]],
        raw: true,
      }),
      AssetCategory.findAll({
        attributes: ["id", "name"],
        order: [["name", "ASC"]],
        raw: true,
      }),
    ]);

    res.render("user/issueAsset/issueAssets", {
      activePage: "issue",
      assets,
      employees,
      categories,
      today: dayjs().format("YYYY-MM-DD"),
      selectedAssetId: req.query.assetId || "",
    });
  } catch (error) {
    logger.error(`Issue view error: ${error}`);
    next(error);
  }
};

exports.issuesApi = async function (req, res, next) {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = Math.max(parseInt(req.query.start) || 0, 0);
    const length = Math.min(Math.max(parseInt(req.query.length) || 10, 1), 100);
    const { query, category } = req.query;   // NEW: category

    
    const where = { returnDate: null, "$asset.status$": "Issued"  };

    // NEW: category is a column on the asset
    if (category && Number.isInteger(Number(category))) {
      where["$asset.category$"] = Number(category);
    }

    if (typeof query === "string" && query.trim()) {
      const q = `%${query.trim()}%`;
      where[Op.or] = [
        { "$asset.assetTag$": { [Op.iLike]: q } },
        { "$asset.serial_no$": { [Op.iLike]: q } },
        { "$asset.make$": { [Op.iLike]: q } },
        { "$asset.model$": { [Op.iLike]: q } },
        { "$employee.name$": { [Op.iLike]: q } },
        { "$employee.employeeId$": { [Op.iLike]: q } },
      ];
    }

    const include = [
      { model: Asset, as: "asset", attributes: ["id", "assetTag", "serial_no", "make", "model", "category"], required: true },
      { model: Employee, as: "employee", attributes: ["id", "employeeId", "name"], required: true },
    ];

    const [recordsTotal, { rows, count }] = await Promise.all([
    AssetIssue.count({
  where: { returnDate: null, "$asset.status$": "Issued" },
  include: [{ model: Asset, as: "asset", attributes: [], required: true }],
}),
      AssetIssue.findAndCountAll({
        where,
        include,
        order: [["issueDate", "DESC"], ["id", "DESC"]],
        limit: length,
        offset: start,
        distinct: true,
      }),
    ]);

    return res.status(200).json({ draw, recordsTotal, recordsFiltered: count, data: rows });
  } catch (error) {
    next(error);
  }
};


const httpError = (statusCode, message) => {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
};

exports.issueAsset = async function (req, res, next) {
  try {
    const { assetId, employeeId, issuedDate, remarks } = req.body;

    await sequelize.transaction(async (t) => {
      // lock the asset row so two users can't issue it at the same time
      const asset = await Asset.findByPk(assetId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!asset) throw httpError(404, "Asset not found");
      if (asset.status !== "In Stock") {
        throw httpError(400, "Only assets In Stock can be issued (current: " + asset.status + ")");
      }

      const employee = await Employee.findByPk(employeeId, { transaction: t });
      if (!employee) throw httpError(400, "Employee not found");
      if (employee.status !== "Active") throw httpError(400, "Employee is not active");

      // both are YYYY-MM-DD strings, so string comparison is correct
      if (issuedDate < asset.acqDate) {
        throw httpError(400, "Issue date cannot be before the purchase date");
      }

      await asset.update(
        {
          status: "Issued",
          assignedTo: employee.id,
          issuedDate,
          returnDate: null,
        },
        { transaction: t }
      );

      await AssetIssue.create(
        {
          assetId: asset.id,
          employeeId: employee.id,
          issueDate: issuedDate,
          issueRemarks: remarks || null,
          issuedBy: req.user.id,
        },
        { transaction: t }
      )
      await logHistory({
  assetId: asset.id,
  action: "Issued",
  actionDate: issuedDate,
  fromStatus: "In Stock",
  toStatus: "Issued",
  employeeId: employee.id,
  remarks,
  userId: req.user.id,
}, t);

      // TODO (AssetHistory): log action "Issued"
    });

    return res.status(200).json({
      success: true,
      message: "Asset issued successfully",
    });
  } catch (error) {
    next(error);
  }
};