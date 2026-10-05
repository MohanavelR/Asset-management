const dayjs = require("dayjs");
const { Op } = require("sequelize");
const Asset = require("../models/asset");
const Employee = require("../models/employee");
const logger = require("../helpers/logger");
const AssetCategory = require("../models/assetCategory");
const AssetIssue = require("../models/issueAsset");
const { sequelize } = require("../config/db");
const { logHistory } = require("../helpers/logHistory");

const { SCRAP_REASONS } = Asset;

const SCRAPPABLE = ["In Stock", "Returned"];
const httpError = (statusCode, message) => {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
};
// ---------- page ----------
exports.scrapAssetView = async function (req, res, next) {
  try {
    const [assets, categories] = await Promise.all([
      Asset.findAll({
        attributes: ["id", "assetTag", "make", "model", "branch", "status"],
        where: { status: SCRAPPABLE },
        order: [["assetTag", "ASC"]],
        raw: true,
      }),
      AssetCategory.findAll({ attributes: ["id", "name"], order: [["name", "ASC"]], raw: true }),
    ]);

    res.render("user/scrapAsset/scrapAssets", {
      activePage: "scrap",
      assets,
      categories,
      reasons: SCRAP_REASONS,
      today: dayjs().format("YYYY-MM-DD"),
    });
  } catch (error) {
    logger.error(`Scrap view error: ${error}`);
    next(error);
  }
};

// ---------- table: already scrapped (unscoped bypasses the default scope) ----------
exports.scrapListApi = async function (req, res, next) {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = Math.max(parseInt(req.query.start) || 0, 0);
    const length = Math.min(Math.max(parseInt(req.query.length) || 10, 1), 100);
    const { query, category } = req.query;

    const where = { status: "Scrapped" };
    if (category && Number.isInteger(Number(category))) where.category = Number(category);

    if (typeof query === "string" && query.trim()) {
      const q = `%${query.trim()}%`;
      where[Op.or] = [
        { assetTag: { [Op.iLike]: q } },
        { serial_no: { [Op.iLike]: q } },
        { make: { [Op.iLike]: q } },
        { model: { [Op.iLike]: q } },
        { branch: { [Op.iLike]: q } },
      ];
    }

    const [recordsTotal, { rows, count }] = await Promise.all([
      Asset.unscoped().count({ where: { status: "Scrapped" } }),
      Asset.unscoped().findAndCountAll({
        where,
        include: [{ model: AssetCategory, as: "categoryInfo", attributes: ["id", "name"] }],
        order: [["scrappedDate", "DESC"], ["id", "DESC"]],
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

// ---------- scrap (unchanged) ----------
exports.scrapAsset = async function (req, res, next) {
  try {
    const { assetId, reason, scrappedDate, remarks } = req.body;

    await sequelize.transaction(async (t) => {
      const asset = await Asset.findByPk(assetId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!asset) throw httpError(404, "Asset not found");
      if (!SCRAPPABLE.includes(asset.status)) {
        throw httpError(400, "Only In Stock or Repair assets can be scrapped (current: " + asset.status + ")");
      }
      if (scrappedDate < asset.acqDate) {
        throw httpError(400, "Scrapped date cannot be before the purchase date");
      }
   const fromStatus = asset.status;
      await asset.update(
        {
          status: "Scrapped",
          scrappedDate,
          scrapReason: reason,
          scrapRemarks: remarks,
          scrappedBy: req.user.id,
          assignedTo: null,
        },
        { transaction: t }
      );
     
await logHistory({
  assetId: asset.id,
  action: "Scrapped",
  actionDate: scrappedDate,
  fromStatus,
  toStatus: "Scrapped",
  reason,
  remarks,
  userId: req.user.id,
}, t);
    });

    return res.status(200).json({ success: true, message: "Asset scrapped successfully" });
  } catch (error) {
    next(error);
  }
};

// ---------- re-stock: Repair -> In Stock ----------
exports.restockAsset = async function (req, res, next) {
  try {
    const id = Number(req.body.assetId);
    if (!Number.isInteger(id) || id < 1) throw httpError(400, "Please select an asset");

    await sequelize.transaction(async (t) => {
      const asset = await Asset.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
      if (!asset) throw httpError(404, "Asset not found");
      if (asset.status !== "Returned") {
        throw httpError(400, "Only assets in Repair can be re-stocked (current: " + asset.status + ")");
      }
      await asset.update({ status: "In Stock", assignedTo: null }, { transaction: t });
     await logHistory({
  assetId: asset.id,
  action: "Re-stocked",
  actionDate: dayjs().format("YYYY-MM-DD"),
  fromStatus: "Returned",
  toStatus: "In Stock",
  userId: req.user.id,
}, t);
    });

    return res.status(200).json({ success: true, message: "Asset is back In Stock" });
  } catch (error) {
    next(error);
  }
};