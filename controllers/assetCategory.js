
const AssetCategory = require("../models/assetCategory");
const logger = require("../helpers/logger");

exports.assetCategoryView = function (req, res, next) {
  try {
    res.render("user/category/categories", { activePage: "assetCategories" });
  } catch (error) {
    logger.error("Asset category view error:", error);
    next(error);
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