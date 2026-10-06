const { Op } = require("sequelize");
const dayjs = require("dayjs");
const {AssetCategory,Employee,Asset,AssetHistory} =require("../models/index")
const logger = require("../helpers/logger");
const { isValidDate, formatDate } = require("../helpers/validation");
const { HISTORY_ACTIONS } = require("../config/contants");


// ========= Asset History List Page ===========
exports.assetHistoryListView = async function (req, res, next) {
  try {
    const categories = await AssetCategory.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      raw: true,
    });

    res.render("user/assetHistory/assetHistoryList", {
      activePage: "history",
      categories,
    });
  } catch (error) {
    logger.error(`Asset history list error: ${error}`);
    res.render("error", { error });
  }
};

// ========= Asset History Table API ===========
exports.assetHistoryListApi = async function (req, res, next) {
  try {
    
    const draw = parseInt(req.query.draw) || 1;
    const start = Math.max(parseInt(req.query.start) || 0, 0);
    const length = Math.min(Math.max(parseInt(req.query.length) || 10, 1), 100);
    const { query, category, action, from, to, branch } = req.query;

    const where = {};

    // dropdown filters
    if (branch) {
      where["$asset.branch$"] = branch;
    }
    if (typeof action === "string" && HISTORY_ACTIONS.includes(action)) where.action = action;
    if (category && Number.isInteger(Number(category))) where["$asset.category$"] = Number(category);

    // date range 
    if (typeof from === "string" && isValidDate(from) && typeof to === "string" && isValidDate(to)) {
      where.actionDate = { [Op.between]: [formatDate(from, 1), formatDate(to, 1)] };
    } 
    else if (typeof from === "string" && isValidDate(from)) {
      where.actionDate = { [Op.gte]: formatDate(from, 1) };
    } 
    else if (typeof to === "string" && isValidDate(to)) {
      where.actionDate = { [Op.lte]: formatDate(to, 1) };
    }

    // search box
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
        model: Asset.unscoped(),
        as: "asset",
        attributes: ["id", "assetTag", "serial_no", "make", "model", "category", "branch"],
        required: true,
      },
      {
        model: Employee,
        as: "employee",
        attributes: ["id", "employeeId", "name"],
        required: false,
      },
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
        subQuery: false,
      }),
    ]);

    return res.status(200).json({ draw, recordsTotal, recordsFiltered: count, data: rows });
  } catch (error) {
    next(error);
  }
};

// ========= Asset History Page  ===========
exports.assetHistoryView = async function (req, res, next) {
  try {
    
    const id = Number(req.params.id);
    
    if (!Number.isInteger(id) || id < 1) {
      return res.render("error", { error: { message: "Asset Not Found" } });
    }

    const [asset, rows] = await Promise.all([
      
      Asset.unscoped().findByPk(id, {
        include: [{ model: AssetCategory, as: "categoryInfo", attributes: ["id", "name"] }],
      }),
      
      AssetHistory.findAll({
        where: { assetId: id },
        include: [{ model: Employee, as: "employee", attributes: ["id", "employeeId", "name"] }],
        order: [["actionDate", "ASC"], ["id", "ASC"]],
      }),
    ]);

    if (!asset) {
      return res.render("error", { error: { message: "Asset Not Found" } });
    }

    const history = rows.map((r) => r.get({ plain: true }));

    res.render("user/assetHistory/assetHistory", {
      activePage: "assets",
      asset: asset.get({ plain: true }),
      history,
    });
  } catch (error) {
    logger.error(`Asset history view error: ${error}`);
    res.render("error", { error });
  }
};