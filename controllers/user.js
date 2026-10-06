const dayjs = require("dayjs");
const { Op, fn, col } = require("sequelize");
const {AssetCategory,Employee,Asset,AssetHistory} =require("../models/index")

const logger = require("../helpers/logger");

// ========= Dashboard View ===========
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
      recent,
    ] = await Promise.all([
      Asset.unscoped().findAll({
        attributes: [
          "status",
          [fn("COUNT", col("id")), "total"],
        ],
        group: ["status"],
        raw: true,
      }),
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
      Asset.findAll({
        attributes: ["category", [fn("COUNT", col("id")), "total"]],
        group: ["category"],
        raw: true,
      }),
      AssetCategory.findAll({ attributes: ["id", "name"], raw: true }),
      Employee.count({ where: { status: "Active" } }),
      AssetHistory.findAll({
        include: [
          { model: Asset.unscoped(), as: "asset", attributes: ["id", "assetTag", "make", "model"], required: true },
          { model: Employee, as: "employee", attributes: ["id", "name"], required: false },
        ],
        order: [["actionDate", "DESC"], ["id", "DESC"]],
        limit: 8,
      }),
    ]);

    const stat = { "In Stock": 0, "Issued": 0, "Returned": 0, "Scrapped": 0 };
    const val = { "In Stock": 0, "Issued": 0, "Returned": 0, "Scrapped": 0 };

    statusRows.forEach((r) => {
      stat[r.status] = Number(r.total);
      val[r.status] = Number(r.value);
    });

    const activeCount = stat["In Stock"] + stat["Issued"] + stat["Returned"];
   
    const nameOf = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const byCategory = categoryRows
      .map((r) => ({ name: nameOf[r.category] || "-", total: Number(r.total) }))
      .sort((a, b) => b.total - a.total);

    res.render("user/dashboard", {
      activePage: "dashboard",
      stat,
      val,
      activeCount,
      activeEmployees,
      branches: branchRows.map((b) => ({ branch: b.branch, total: Number(b.total), value: Number(b.value) })),
      byCategory,
      maxCategory: byCategory.length ? byCategory[0].total : 1,
      recent: recent.map((r) => r.get({ plain: true })),
    });
  } catch (error) {
    logger.error(`Dashboard error: ${error}`);
    res.render("error", { error });
  }
};