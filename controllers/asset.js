// controllers/assetController.js
const { Op } = require("sequelize");
const logger = require("../helpers/logger");
const { sequelize } = require("../config/db");
const { logHistory } = require("../helpers/logHistory");
const {AssetCategory,Employee,Asset} =require("../models/index")

// ========= Helpers ===========

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


// ================== Page Views =======================

// ========= Asset List Page ===========
exports.assetListView = async function (req, res, next) {
  try {
    const categories = await AssetCategory.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      raw: true,
    });
    res.render("user/assets/assets", {
      activePage: "assets",
      categories,
    });

  } catch (error) {
    logger.error(`Asset list page error: ${error}`);
    res.render("error", { error });
  }
};

// ========= View Asset Page (single asset detail) ===========
exports.viewAssetView = async function (req, res, next) {
  try {
    const id = Number(req.params.id);
   
    if (!Number.isInteger(id) || id < 1) {
      return res.render("error", { error: { message: "Assets Not Found" } });
    }

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

    if (!asset) {
      return res.render("error", { error: { message: "Assets Not Found" } });
    }

    res.render("user/assets/viewAsset", {
      activePage: "assets",
      asset: asset.get({ plain: true }),
    });
  } catch (error) {
    logger.error(`Asset view page error: ${error}`);
    res.render("error", { error });
  }
};

// ========= Add Asset Page (empty form) ===========
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
    res.render("error", { error });
  }
};

// ========= Edit Asset Page (same form, filled with asset data) ===========
exports.editAssetView = async function (req, res, next) {
  try {
    const asset = await Asset.findByPk(req.params.id, { raw: true });

    if (!asset) {
      return res.render("error", { error: { message: "Assets Not Found" } });
    }
    const { categories, employees } = await getFormData();
    
    res.render("user/assets/assetForm", {
      activePage: "assets",
      asset,
      categories,
      employees,
    });
  } catch (error) {
    logger.error(`Asset edit view error: ${error}`);
    res.render("error", { error });
  }
};



// ========= Table (DataTable) API ===========



exports.assetsApi = async function (req, res, next) {
  try {
    const draw = parseInt(req.query.draw) || 1;
    const start = Math.max(parseInt(req.query.start) || 0, 0);
    const length = Math.min(Math.max(parseInt(req.query.length) || 10, 1), 100);
    const { query, status, category} = req.query;

    const where = {};

    // search box
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
    // dropdown filters
    if (status) where.status = status;
    if (category && Number.isInteger(Number(category))){
        where.category = Number(category);
    } 

    // sorting
    const order =  [["createdAt", "DESC"]];

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


// ========= CRUD ===========


// ================== create assets ======================
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


    //  =========== create Asset History ==============
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

//================= update asset details ==============
exports.updateAsset = async function (req, res, next) {
  try {
    const asset = await Asset.findByPk(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

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

// ================== delete asset ===================
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