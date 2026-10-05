
const AssetCategory = require("../models/assetCategory");
const logger = require("../helpers/logger");
const { Op } = require("sequelize");
exports.assetCategoryView = function (req, res, next) {
  try {
    res.render("user/category/categories", { activePage: "assetCategories" });
  } catch (error) {
    logger.error("Asset category view error:", error);
    next(error);
  }
};

exports.categoryList = async (req, res) => {
  try {
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const search = (req.query.query || "").trim();

    const where = search
      ? {
          [Op.or]: [
            { name: { [Op.iLike]: `%${search}%` } },
            
          ],
        }
      : {};

    const recordsTotal = await AssetCategory.count();
    const { count: recordsFiltered, rows } = await AssetCategory.findAndCountAll({
      where,
      order: [["createdAt", "DESC"]],
      offset: start,
      limit: length,
      raw: true,
    });

    res.json({
      draw: parseInt(req.query.draw) || 0,
      recordsTotal,
      recordsFiltered,
      data: rows,
    });
  } catch (err) {
    logger.error("Employee List Error:", err);
       res.status(500).json({
         draw: parseInt(req.query.draw, 10) || 1,
         recordsTotal: 0,
         recordsFiltered: 0,
         data: [],
         error: "Server error",
    });
  }
};

exports.createAssetCategory = async function (req, res, next) {
  try {
    const { name, desc } = req.body;
    const category = await AssetCategory.create({name,desc,c_by: req.user.id, })
    
    return res.status(201).json({
      success: true,
      message: "Asset category created successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAssetCategory = async function (req, res, next) {
  try {
    const { id } = req.params;
    const { name, desc } = req.body;
    const category = await AssetCategory.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Asset category not found",
      });
    }
    await category.update({name,desc})
    return res.status(200).json({
      success: true,
      message: "Asset category updated successfully",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAssetCategory = async function (req, res, next) {
  try {
    const { id } = req.params;

    const category = await AssetCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Asset category not found",
      });
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: "Asset category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};