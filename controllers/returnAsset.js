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

const { RETURN_REASONS } = AssetIssue;

// ---------- page ----------
exports.returnAssetView = async function (req, res, next) {
  try {
    const [issues, categories,employees] = await Promise.all([
      AssetIssue.findAll({
        where: { returnDate: null },
        include: [
          { model: Asset, as: "asset", attributes: ["id", "assetTag", "make", "model"], required: true },
          { model: Employee, as: "employee", attributes: ["id", "employeeId", "name"], required: true },
          
        ],
        order: [["issueDate", "DESC"]],
      }),
      AssetCategory.findAll({ attributes: ["id", "name"], order: [["name", "ASC"]], raw: true }),
     Employee.findAll({
        attributes: ["id", "employeeId", "name", "department"],
        where: { status: "Active" },
        order: [["name", "ASC"]],
        raw: true,
      }),
    ]);

    res.render("user/returnAsset/returnAssets.jade", {
      activePage: "return",
      issues: issues.map((i) => i.get({ plain: true })),
      categories,
      employees,
      reasons: RETURN_REASONS,
      today: dayjs().format("YYYY-MM-DD"),
      selectedAssetId: req.query.assetId || "",
    });
  } catch (error) {
    logger.error(`Return view error: ${error}`);
    next(error);
  }
};

// ---------- table data: returned records only ----------
exports.returnsApi = async function (req, res, next) {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = Math.max(parseInt(req.query.start) || 0, 0);
    const length = Math.min(Math.max(parseInt(req.query.length) || 10, 1), 100);
    const { query, category, reason } = req.query;

    const where = { 
      "$asset.status$": "Returned",
      returnDate: { [Op.ne]: null } 
    };

    if (category && Number.isInteger(Number(category))) {
      where["$asset.category$"] = Number(category);
    }
    if (typeof reason === "string" && RETURN_REASONS.includes(reason)) {
      where.returnReason = reason;
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
      { 
        model: Asset, 
        as: "asset", 
        attributes: ["id", "assetTag", "serial_no", "make", "model", "category"], 
        required: true 
      },
      { 
        model: Employee, 
        as: "employee", 
        attributes: ["id", "employeeId", "name"], 
        required: true 
      },
    ];

    const [recordsTotal, { rows, count }] = await Promise.all([
      AssetIssue.count({
        where: { returnDate: { [Op.ne]: null } },
        include: [
          {
            model: Asset,
            as: "asset",
            where: { status: "Returned" },
            required: true,
          },
        ],
      }),
      AssetIssue.findAndCountAll({
        where,
        include,
        order: [["returnDate", "DESC"], ["id", "DESC"]],
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

// ---------- save ----------
exports.returnAsset = async function (req, res, next) {
  try {
    const { assetId, reason, returnDate, remarks } = req.body;

    await sequelize.transaction(async (t) => {
      const asset = await Asset.findByPk(assetId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!asset) throw httpError(404, "Asset not found");
      if (asset.status !== "Issued") throw httpError(400, "Only issued assets can be returned");

      const issue = await AssetIssue.findOne({
        where: { assetId: asset.id, returnDate: null },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!issue) throw httpError(400, "No open issue found for this asset");

      if (returnDate < issue.issueDate) {
        throw httpError(400, "Return date cannot be before the issue date");
      }

      await issue.update(
        { returnDate, returnReason: reason, returnRemarks: remarks, returnedBy: req.user.id },
        { transaction: t }
      );

      // Repair goes to Repair status, every other reason goes back to stock
      const employeeId = issue.employeeId;
const newStatus = reason === "Resignation" ? "In Stock" : "Returned";
      await asset.update(
        {
          status: newStatus,
          assignedTo: null,
          returnDate,
        },
        { transaction: t }
      );

     await logHistory({
  assetId: asset.id,
  action: "Returned",
  actionDate: returnDate,
  fromStatus: "Issued",
  toStatus: newStatus,
  employeeId,
  reason,
  remarks,
  userId: req.user.id,
}, t);
    });

    return res.status(200).json({ success: true, message: "Asset returned successfully" });
  } catch (error) {
    next(error);
  }
};