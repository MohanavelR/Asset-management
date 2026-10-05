const { Op, fn, col } = require("sequelize");
const Asset = require("../models/asset");
const AssetCategory = require("../models/assetCategory");

exports.stockApi = async function (req, res, next) {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = Math.max(parseInt(req.query.start) || 0, 0);
    const length = Math.min(Math.max(parseInt(req.query.length) || 10, 1), 100);
    const { query, category, branch } = req.query;

    const where = { status: "In Stock" };

    if (typeof query === "string" && query.trim()) {
      const q = `%${query.trim()}%`;
      where[Op.or] = [
        { assetTag: { [Op.iLike]: q } },
        { serial_no: { [Op.iLike]: q } },
        { make: { [Op.iLike]: q } },
        { model: { [Op.iLike]: q } },
      ];
    }
    if (category && Number.isInteger(Number(category))) where.category = Number(category);
    if (typeof branch === "string" && branch.trim()) where.branch = branch.trim();

    const [recordsTotal, { rows, count }, branchRows] = await Promise.all([
      Asset.count({ where: { status: "In Stock" } }),
      Asset.findAndCountAll({
        where,
        include: [{ model: AssetCategory, as: "categoryInfo", attributes: ["id", "name"] }],
        order: [["branch", "ASC"], ["assetTag", "ASC"]],
        limit: length,
        offset: start,
        distinct: true,
      }),
      // totals by branch, for ALL rows matching the filters (not only this page)
      Asset.findAll({
        attributes: [
          "branch",
          [fn("COUNT", col("id")), "total"],
          [fn("COALESCE", fn("SUM", col("acqPrice")), 0), "value"],
        ],
        where,
        group: ["branch"],
        order: [["branch", "ASC"]],
        raw: true,
      }),
    ]);

    const branches = branchRows.map((r) => ({
      branch: r.branch,
      total: Number(r.total),
      value: Number(r.value),
    }));

    const totals = branches.reduce(
      (s, b) => ({ total: s.total + b.total, value: s.value + b.value }),
      { total: 0, value: 0 }
    );
    totals.value = Math.round(totals.value * 100) / 100;

    return res.status(200).json({
      draw,
      recordsTotal,
      recordsFiltered: count,
      data: rows,
      branches,   // totals by branch
      totals,     // grand total for the footer
    });
  } catch (error) {
    next(error);
  }
};
exports.stockView = async function (req, res, next) {
  try {
    const [categories, branchRows] = await Promise.all([
      AssetCategory.findAll({ attributes: ["id", "name"], order: [["name", "ASC"]], raw: true }),
      Asset.findAll({
        attributes: ["branch"],
        where: { status: "In Stock" },
        group: ["branch"],
        order: [["branch", "ASC"]],
        raw: true,
      }),
    ]);

    res.render("user/stock/stocks", {
      activePage: "stock",
      categories,
      branches: branchRows.map((b) => b.branch),
    });
  } catch (error) {
    logger.error(`Stock view error: ${error}`);
    next(error);
  }
};