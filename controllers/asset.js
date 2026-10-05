// controllers/assetController.js
const { Op } = require("sequelize");
const Asset = require("../models/asset");
const AssetCategory = require("../models/assetCategory");
const logger = require("../helpers/logger");
const Employee = require("../models/employee");
const { sequelize } = require("../config/db");
const { logHistory } = require("../helpers/logHistory");
Asset.belongsTo(AssetCategory, { foreignKey: "category", as: "categoryInfo" });
AssetCategory.hasMany(Asset, { foreignKey: "category", as: "assets", onDelete: "RESTRICT" });
Asset.belongsTo(Employee, { foreignKey: "assignedTo", as: "employee" });
Employee.hasMany(Asset, { foreignKey: "assignedTo", as: "assets", onDelete: "SET NULL" });
const assetIncludes = () => [{
  model: AssetCategory,
  as: "categoryInfo",
  attributes: ["id", "name"]
},
{
  model: Employee,
  as: "employee",
  attributes: ["id", "employeeId", "name"]
},
];
async function getFormData() {
  const [categories, employees] = await Promise.all([
    AssetCategory.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      raw: true,
    }),
    Employee.findAll({
      attributes: ["id", "employeeId", "name"],
      where: { status: "Active" },
      order: [["name", "ASC"]],
      raw: true,
    }),
  ]);
  return { categories, employees };
}
exports.assetListView = async function (req, res, next) {
  try {
    const categories = await AssetCategory.findAll({
      attributes: ["id", "name"], order: [["name", "ASC"]], raw: true,
    });
    res.render("user/assets/assets", { activePage: "assets", categories });
  } catch (error) {
    next(error);
  }
};

exports.viewAssetView = async function (req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(404).send("Asset not found");

    const asset = await Asset.findByPk(id, {
  include: [
    { model: AssetCategory, as: "categoryInfo", attributes: ["id", "name"] },
    {
      model: Employee,
      as: "employee",
      attributes: ["id", "employeeId", "name", "department", "designation", "branch"],
    },
  ],
});
    if (!asset) return res.status(404).send("Asset not found");

    res.render("user/assets/viewAsset", {
      activePage: "assets",
      asset: asset.get({ plain: true }),
    });
  } catch (error) {
    logger.error(`Asset view page error: ${error}`);
    next(error);
  }
};

exports.addAssetView = async function (req, res, next) {
  try {
    const { categories, employees } = await getFormData();
    res.render("user/assets/assetForm", {
      activePage: "assets",
      categories,
      employees,
    });
  } catch (error) {
    logger.error(`Asset add view error: ${error}`);
    next(error);
  }
};


exports.editAssetView = async function (req, res, next) {
  try {
    const asset = await Asset.findByPk(req.params.id, { raw: true });
    if (!asset) return res.status(404).send("Asset not found");

    const { categories, employees } = await getFormData();

    res.render("user/assets/assetForm", {
      activePage: "assets",
      asset,
      categories,
      employees,
    });
  } catch (error) {
    logger.error(`Asset edit view error: ${error}`);
    next(error);
  }
};



const SORTABLE = {
  assetTag: ["assetTag"],
  serial_no: ["serial_no"],
  make: ["make"],
  model: ["model"],
  branch: ["branch"],
  status: ["status"],
  acqDate: ["acqDate"],
  "categoryInfo.name": [{ model: AssetCategory, as: "categoryInfo" }, "name"],
};

exports.assetsApi = async function (req, res, next) {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = Math.max(parseInt(req.query.start) || 0, 0);
    const length = Math.min(Math.max(parseInt(req.query.length) || 10, 1), 100);
    const { query, status, category, orderCol, orderDir } = req.query;

    const where = {};

    if (query && query.trim()) {
      const q = `%${query.trim()}%`;
      where[Op.or] = [
        { assetTag: { [Op.iLike]: q } },
        { serial_no: { [Op.iLike]: q } },
        { make: { [Op.iLike]: q } },
        { model: { [Op.iLike]: q } },
        { vendor: { [Op.iLike]: q } },
        { branch: { [Op.iLike]: q } },
      ];
    }
    if (status) where.status = status;
    if (category && Number.isInteger(Number(category))) where.category = Number(category);

    const sortPath = SORTABLE[orderCol];
    const dir = orderDir === "asc" ? "ASC" : "DESC";
    const order = sortPath ? [[...sortPath, dir]] : [["createdAt", "DESC"]];

    const [recordsTotal, { rows, count }] = await Promise.all([
      Asset.count(),
      Asset.findAndCountAll({
        where,
        include: [{ model: AssetCategory, as: "categoryInfo", attributes: ["id", "name"] }],
        order,
        limit: length,
        offset: start,
      }),
    ]);

    return res.status(200).json({
      draw,
      recordsTotal,
      recordsFiltered: count,
      data: rows,
    });
  } catch (error) {
    next(error);
  }
};
exports.getAssetById = async function (req, res, next) {
  try {
    const asset = await Asset.findByPk(req.params.id, {
      include: [categoryInclude],
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    return res.status(200).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};

exports.createAsset = async function (req, res, next) {
  
  try {
    const {
      serial_no, category, make, model,
      acqDate, acqPrice, vendor, branch,
      specifications, warrantyStartDate, warrantyEndDate,
    } = req.body;
    const asset = await sequelize.transaction(async (t) => {
      const created = await Asset.create(
        {
          serial_no,
          category,
          make,
          model,
          acqDate: acqDate ? acqDate : null,
          acqPrice,
          vendor,
          branch,
          specifications: specifications || null,
          warrantyStartDate: warrantyStartDate ? warrantyStartDate : null,
          warrantyEndDate: warrantyEndDate ? warrantyEndDate : null,
          c_by: req.user.id,
        },
        { transaction: t }
      );


      await logHistory(
        {
          assetId: created.id,
          action: "Purchased",
          actionDate: created.acqDate,
          toStatus: "In Stock",
          amount: created.acqPrice,
          userId: req.user.id,
        },
        t
      );

      return created; 
    });


    return res.status(201).json({
      success: true,
      message: "Asset created successfully",
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};
exports.updateAsset = async function (req, res, next) {
  try {
    const asset = await Asset.findByPk(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // id and assetTag are never updated (primary key and generated tag)
    await asset.update({
      serial_no: req.body.serial_no,
      category: req.body.category,
      make: req.body.make,
      model: req.body.model,
      acqDate: req.body.acqDate,
      acqPrice: req.body.acqPrice,
      vendor: req.body.vendor,
      branch: req.body.branch,
      specifications: req.body.specifications,
      warrantyStartDate: req.body.warrantyStartDate,
      warrantyEndDate: req.body.warrantyEndDate,
    });

    return res.status(200).json({
      success: true,
      message: "Asset updated successfully",
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAsset = async function (req, res, next) {
  try {
    const asset = await Asset.findByPk(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    await asset.destroy();

    return res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};