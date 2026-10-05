const { Op } = require("sequelize");
const dayjs = require("dayjs");
const Asset = require("../models/asset");
const AssetCategory = require("../models/assetCategory");
const Employee = require("../models/employee");
const AssetHistory = require("../models/assetHistory");
const logger = require("../helpers/logger");
const { isValidDate, formatDate } = require("../helpers/validation");
const { HISTORY_ACTIONS } = AssetHistory;
Asset.hasMany(AssetHistory, { foreignKey: "assetId", as: "history" });
AssetHistory.belongsTo(Asset, { foreignKey: "assetId", as: "asset" });

Employee.hasMany(AssetHistory, { foreignKey: "employeeId", as: "assetHistory" });
AssetHistory.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });


exports.assetHistoryListView = async function (req, res, next) {
  try {
    const categories = await AssetCategory.findAll({
      attributes: ["id", "name"], order: [["name", "ASC"]], raw: true,
    });
    res.render("user/assetHistory/assetHistoryList", {
      activePage: "history",
      categories,
    });
  } catch (error) {
    logger.error(`Asset history list error: ${error}`);
    next(error);
  }
};

exports.assetHistoryListApi = async function (req, res, next) {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = Math.max(parseInt(req.query.start) || 0, 0);
    const length = Math.min(Math.max(parseInt(req.query.length) || 10, 1), 100);
    const { query, category, action, from, to } = req.query;

    const where = {};

    if (typeof action === "string" && HISTORY_ACTIONS.includes(action)) where.action = action;
    if (category && Number.isInteger(Number(category))) where["$asset.category$"] = Number(category);

    // date range on the event date (YYYY-MM-DD)
    if (typeof from === "string" && isValidDate(from) && typeof to === "string" && isValidDate(to)) {
      where.actionDate = { [Op.between]: [formatDate(from, 1), formatDate(to, 1)] };
    } else if (typeof from === "string" && isValidDate(from)) {
      where.actionDate = { [Op.gte]: formatDate(from, 1) };
    } else if (typeof to === "string" && isValidDate(to)) {
      where.actionDate = { [Op.lte]: formatDate(to, 1) };
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
        // unscoped: events of scrapped assets must still show
        model: Asset.unscoped(),
        as: "asset",
        attributes: ["id", "assetTag", "serial_no", "make", "model", "category"],
        required: true,
      },
      { model: Employee, as: "employee", attributes: ["id", "employeeId", "name"], required: false },
    ];

    const [recordsTotal, { rows, count }] = await Promise.all([
      AssetHistory.count(),
      AssetHistory.findAndCountAll({
        where,
        include,
        order: [["actionDate", "DESC"], ["id", "DESC"]],
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
exports.assetHistoryView = async function (req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(404).send("Asset not found");

    const [asset, rows] = await Promise.all([
      // unscoped: scrapped assets must still show their history
      Asset.unscoped().findByPk(id, {
        include: [{ model: AssetCategory, as: "categoryInfo", attributes: ["id", "name"] }],
      }),
      AssetHistory.findAll({
        where: { assetId: id },
        include: [{ model: Employee, as: "employee", attributes: ["id", "employeeId", "name"] }],
        order: [["actionDate", "ASC"], ["id", "ASC"]],
      }),
    ]);

    if (!asset) return res.status(404).send("Asset not found");

    const history = rows.map((r) => r.get({ plain: true }));
    const todayStr = dayjs().format("YYYY-MM-DD");

    // ---------- utilization summary ----------
    let daysIssued = 0;
    let issueCount = 0;
    let openFrom = null; // date of the current open issue

    for (const h of history) {
      if (h.action === "Issued") {
        issueCount++;
        openFrom = h.actionDate;
      } else if (h.action === "Returned" && openFrom) {
        daysIssued += dayjs(h.actionDate).diff(dayjs(openFrom), "day");
        openFrom = null;
      }
    }
    // still with an employee: count up to today
    if (openFrom) daysIssued += dayjs(todayStr).diff(dayjs(openFrom), "day");

    const endDate = asset.status === "Scrapped" ? asset.scrappedDate : todayStr;
    const lifeDays = Math.max(dayjs(endDate).diff(dayjs(asset.acqDate), "day"), 0);
    const price = Number(asset.acqPrice) || 0;

    const summary = {
      price,
      issueCount,
      daysIssued,
      lifeDays,
      utilization: lifeDays > 0 ? Math.round((daysIssued / lifeDays) * 100) : 0, // % of life in use
      costPerIssuedDay: daysIssued > 0 ? Math.round((price / daysIssued) * 100) / 100 : null,
    };

    res.render("user/assetHistory/assetHistory", {
      activePage: "assets",
      asset: asset.get({ plain: true }),
      history,
      summary,
    });
  } catch (error) {
    logger.error(`Asset history view error: ${error}`);
    next(error);
  }
};

