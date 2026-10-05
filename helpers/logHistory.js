const AssetHistory = require("../models/assetHistory");


async function logHistory(p, t) {
  return AssetHistory.create(
    {
      assetId: p.assetId,
      action: p.action,
      actionDate: p.actionDate,
      fromStatus: p.fromStatus || null,
      toStatus: p.toStatus,
      employeeId: p.employeeId || null,
      reason: p.reason || null,
      remarks: p.remarks || null,
      amount: p.amount ?? null,
      performedBy: p.userId || null,
    },
    { transaction: t }
  );
}

module.exports = { logHistory };