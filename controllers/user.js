const dayjs = require("dayjs");
const { Op, fn, col } = require("sequelize");
const Asset = require("../models/asset");
const AssetCategory = require("../models/assetCategory");
const AssetHistory = require("../models/assetHistory");
const Employee = require("../models/employee");
const logger = require("../helpers/logger");

exports.dashboardView = async function (req, res, next) {
  try {
    const todayStr = dayjs().format("YYYY-MM-DD");
    const in30 = dayjs().add(30, "day").format("YYYY-MM-DD");

    const [
      statusRows,
      branchRows,
      categoryRows,
      categories,
      activeEmployees,
      expiring,
      recent,
    ] = await Promise.all([
      // counts and value per status (unscoped, so Scrapped is included)
      Asset.unscoped().findAll({
        attributes: [
          "status",
          [fn("COUNT", col("id")), "total"],
          [fn("COALESCE", fn("SUM", col("acqPrice")), 0), "value"],
        ],
        group: ["status"],
        raw: true,
      }),

      // In Stock by branch
      Asset.findAll({
        attributes: [
          "branch",
          [fn("COUNT", col("id")), "total"],
          [fn("COALESCE", fn("SUM", col("acqPrice")), 0), "value"],
        ],
        where: { status: "In Stock" },
        group: ["branch"],
        order: [["branch", "ASC"]],
        raw: true,
      }),

      // active assets per category (default scope hides Scrapped)
      Asset.findAll({
        attributes: ["category", [fn("COUNT", col("id")), "total"]],
        group: ["category"],
        raw: true,
      }),

      AssetCategory.findAll({ attributes: ["id", "name"], raw: true }),

      Employee.count({ where: { status: "Active" } }),

      // warranty ending within 30 days
      Asset.findAll({
        attributes: ["id", "assetTag", "make", "model", "warrantyEndDate"],
        where: { warrantyEndDate: { [Op.between]: [todayStr, in30] } },
        order: [["warrantyEndDate", "ASC"]],
        limit: 5,
        raw: true,
      }),

      // last 8 events
      AssetHistory.findAll({
        include: [
          { model: Asset.unscoped(), as: "asset", attributes: ["id", "assetTag", "make", "model"], required: true },
          { model: Employee, as: "employee", attributes: ["id", "name"], required: false },
        ],
        order: [["actionDate", "DESC"], ["id", "DESC"]],
        limit: 8,
      }),
    ]);

    // ---------- status counts ----------
    const stat = { "In Stock": 0, "Issued": 0, "Returned": 0, "Scrapped": 0 };
    const val = { "In Stock": 0, "Issued": 0, "Returned": 0, "Scrapped": 0 };
    statusRows.forEach((r) => {
      stat[r.status] = Number(r.total);
      val[r.status] = Number(r.value);
    });

    const activeCount = stat["In Stock"] + stat["Issued"] + stat["Returned"];
    const activeValue = val["In Stock"] + val["Issued"] + val["Returned"];

    // ---------- category names ----------
    const nameOf = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const byCategory = categoryRows
      .map((r) => ({ name: nameOf[r.category] || "-", total: Number(r.total) }))
      .sort((a, b) => b.total - a.total);

    res.render("user/dashboard", {
      activePage: "dashboard",
      stat,
      val,
      activeCount,
      activeValue,
      activeEmployees,
      branches: branchRows.map((b) => ({ branch: b.branch, total: Number(b.total), value: Number(b.value) })),
      byCategory,
      maxCategory: byCategory.length ? byCategory[0].total : 1,
      expiring,
      recent: recent.map((r) => r.get({ plain: true })),
    });
  } catch (error) {
    logger.error(`Dashboard error: ${error}`);
    next(error);
  }
};