const {AssetCategory,Employee,Asset,AssetIssue} =require("../models/index")

const dayjs = require("dayjs");
const { Op } = require("sequelize");

const logger = require("../helpers/logger");
const { sequelize } = require("../config/db");
const { logHistory } = require("../helpers/logHistory");

// ========= Issue Asset Page  ===========
exports.issueAssetView = async function (req, res, next) {
  try {
    const [assets, employees, categories] = await Promise.all([
      Asset.findAll({
        attributes: ["id", "assetTag", "make", "model", "serial_no", "branch"],
        where: { status: "In Stock" },
        order: [["assetTag", "ASC"]],
        raw: true,
      }),
      Employee.findAll({
        attributes: ["id", "employeeId", "name", "department"],
        where: { status: "Active" },
        order: [["name", "ASC"]],
        raw: true,
      }),
      AssetCategory.findAll({
        attributes: ["id", "name"],
        order: [["name", "ASC"]],
        raw: true,
      }),
    ]);

    res.render("user/issueAsset/issueAssets", {
      activePage: "issue",
      assets,
      employees,
      categories,
      today: dayjs().format("YYYY-MM-DD"),
      selectedAssetId: req.query.assetId || "",
    });
  } catch (error) {
    logger.error(`Issue view error: ${error}`);
    res.render("error", { error });
  }
};

// ========= Issued Assets Table API  ===========
exports.issuesApi = async function (req, res, next) {
  try {
   
    const draw = parseInt(req.query.draw) || 1;
    const start = Math.max(parseInt(req.query.start) || 0, 0);
    const length = Math.min(Math.max(parseInt(req.query.length) || 10, 1), 100);
    const { query, category, branch } = req.query;

    const where = { returnDate: null, "$asset.status$": "Issued" };
   
    if (category && Number.isInteger(Number(category))) {
      where["$asset.category$"] = Number(category);
    }
    if (branch) {
      where["$asset.branch$"] = branch;
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
        model: Asset,
        as: "asset",
        attributes: ["id", "assetTag", "serial_no", "make", "model", "category"],
        required: true,
      },
      {
        model: Employee,
        as: "employee",
        attributes: ["id", "employeeId", "name"],
        required: true,
      },
    ];

    
    const [recordsTotal, { rows, count }] = await Promise.all([
      AssetIssue.count({
        where: { returnDate: null, "$asset.status$": "Issued" },
        include: [{ model: Asset, as: "asset", attributes: [], required: true }],
      }),
      AssetIssue.findAndCountAll({
        where,
        include,
        order: [["issueDate", "DESC"], ["id", "DESC"]],
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


// ========= Issue Asset  ===========
exports.issueAsset = async function (req, res, next) {
  try {
    const { assetId, employeeId, issuedDate, remarks } = req.body;

    const failed = await sequelize.transaction(async (t) => {
      const asset = await Asset.findByPk(assetId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!asset){
          return { status: 404, message: "Asset not found" };
      } 
      if (asset.status !== "In Stock") {
        return {
          status: 400,
          message: "Only assets In Stock can be issued (current: " + asset.status + ")",
        };
      }

      
      const employee = await Employee.findByPk(employeeId, { 
        transaction: t 
      });
      if (!employee){
        return { status: 400, message: "Employee not found" };
      } 
      if (employee.status !== "Active"){
         return { status: 400, message: "Employee is not active" };
      } 

      
      if (issuedDate < asset.acqDate) {
        return { status: 400, message: "Issue date cannot be before the purchase date" };
      }

  
      await asset.update(
        {
          status: "Issued",
          assignedTo: employee.id,
          issuedDate,
          returnDate: null,
        },
        { transaction: t }
      );

      // open issue record 
      await AssetIssue.create(
        {
          assetId: asset.id,
          employeeId: employee.id,
          issueDate: issuedDate,
          issueRemarks: remarks || null,
          issuedBy: req.user.id,
        },
        { transaction: t }
      );

      // ======== Asset History =======
      await logHistory(
        {
          assetId: asset.id,
          action: "Issued",
          actionDate: issuedDate,
          fromStatus: "In Stock",
          toStatus: "Issued",
          employeeId: employee.id,
          remarks,
          userId: req.user.id,
        },
        t
      );

      return null; 
    });

   
    if (failed) {
      return res.status(failed.status).json({
        success: false,
        message: failed.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Asset issued successfully",
    });
 
  } catch (error) {
    next(error);
  }
};