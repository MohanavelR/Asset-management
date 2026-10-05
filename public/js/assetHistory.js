const esc = (v) => $("<div>").text(v || "-").html();
const fmt = (d) => (d ? d.split("-").reverse().join("-") : "-");
const money = (v) =>
  v === null || v === undefined || v === ""
    ? "-"
    : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const colors = {
  "Purchased": "secondary", "Issued": "primary", "Returned": "warning",
  "Re-stocked": "success", "Scrapped": "danger"
};

const table = $("#historyTable").DataTable({
  serverSide: true,
  processing: false,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  ajax: {
    url: "/assetHistoryApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.category = $("#categoryFilter").val() || "";
      d.action = $("#actionFilter").val() || "";
      d.from = $("#fromDate").val() || "";
      d.to = $("#toDate").val() || "";
    },
    dataSrc: function (res) { return res.data; }
  },
  columns: [
    { data: "actionDate", render: fmt },
    { data: "asset.assetTag" },
    { data: null, render: (r) => esc(r.asset.make + " " + r.asset.model) },
    {
      data: "action",
      render: (a) => '<span class="badge text-bg-' + (colors[a] || "secondary") + '">' + esc(a) + "</span>"
    },
    { data: null, render: (r) => (r.employee ? esc(r.employee.employeeId + " - " + r.employee.name) : "-") },
    { data: null, render: (r) => esc((r.fromStatus || "-") + " → " + r.toStatus) },
    {
      data: "assetId",
      render: (id) =>
        '<a href="/assets/history/' + id + '" class="btn btn-sm btn-outline-primary">' +
        '<i class="fa-solid fa-clock-rotate-left"></i></a>'
    }
  ]
});

table.on("preXhr.dt", function () {
  $("#historyLoading").removeClass("d-none");
  $("#historyEmpty, #historyError").addClass("d-none");
});
table.on("xhr.dt", function (e, s, json) {
  $("#historyLoading").addClass("d-none");
  $("#historyEmpty").toggleClass("d-none", !!(json && json.data && json.data.length));
});
table.on("error.dt", function () {
  $("#historyLoading, #historyEmpty").addClass("d-none");
  $("#historyError").removeClass("d-none");
});

let filterTimer;
function reloadTable() {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => table.ajax.reload(), 300);
}
$("#searchInput").on("input", reloadTable);
$("#categoryFilter, #actionFilter, #fromDate, #toDate").on("change", reloadTable);

$("#resetFilters").on("click", function () {
  $("#searchInput, #categoryFilter, #actionFilter, #fromDate, #toDate").val("");
  table.ajax.reload();
});