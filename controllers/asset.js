// controllers/assetController.js
const { Op } = require("sequelize");
const Asset = require("../models/asset");
const AssetCategory = require("../models/assetCategory");
const logger = require("../helpers/logger");

const categoryInclude = {
  model: AssetCategory,
  as: "categoryInfo",
  attributes: ["id", "name"],
};

exports.addAssetView = async function (req, res, next) {
  try {
    const categories = await AssetCategory.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      raw: true,
    });

    res.render("user/assets/addAsset", { activePage: "assets", categories });
  } catch (error) {
    logger.error("Asset view error:", error);
    next(error);
  }
};

exports.editAssetView = async function (req, res, next) {
  try {
    const asset = await Asset.findByPk(req.params.id, { raw: true });
    if (!asset) return res.status(404).send("Asset not found");

    const categories = await AssetCategory.findAll({
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
      raw: true,
    });

    res.render("user/assets/addAsset", { activePage: "assets", asset, categories });
  } catch (error) {
    logger.error("Asset edit view error:", error);
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
      id, serial_no, category, make, model,
      acqDate, acqPrice, vendor, branch, status,
      issuedDate, returnDate, scrappedDate, specifications,
    } = req.body;

    const asset = await Asset.create({
      id, serial_no, category, make, model,
      acqDate, acqPrice, vendor, branch, status,
      issuedDate, returnDate, scrappedDate, specifications,
      c_by: req.user.id,
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

    // id is not updated: it is the primary key
    await asset.update({
      serial_no: req.body.serial_no,
      category: req.body.category,
      make: req.body.make,
      model: req.body.model,
      acqDate: req.body.acqDate,
      acqPrice: req.body.acqPrice,
      vendor: req.body.vendor,
      branch: req.body.branch,
      status: req.body.status,
      issuedDate: req.body.issuedDate,
      returnDate: req.body.returnDate,
      scrappedDate: req.body.scrappedDate,
      specifications: req.body.specifications,
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