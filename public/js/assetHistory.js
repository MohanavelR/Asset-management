const esc = (v) => $("<div>").text(v || "-").html();
const fmt = (d) => (d ? d.split("-").reverse().join("-") : "-"); // YYYY-MM-DD -> DD-MM-YYYY
const colors = {
  "Purchased": "secondary", "Issued": "primary", "Returned": "warning",
  "Re-stocked": "success", "Scrapped": "danger"
};


// ======================= DataTable =======================
const table = $("#historyTable").DataTable({
  serverSide: true,
  processing: true,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  language: dataTableMessages("Asset History", "fas fa-box"),
  ajax: {
    url: "/assetHistoryApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.category = $("#categoryFilter").val() || "";
      d.branch = $("#branchFilter").val() || "";
      d.action = $("#actionFilter").val() || "";
      d.from = $("#fromDate").val() || "";
      d.to = $("#toDate").val() || "";
    },
    dataSrc: function (res) {
      return res.data;
    },
    error: function (xhr) {
    console.error("ajax failed:", xhr.status, xhr.responseText);
  }
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
      orderable: false,
      render: (id) =>
        '<a href="/assets/history/' + id + '" class="btn btn-sm btn-outline-primary" title="Timeline">' +
        '<i class="fa-solid fa-clock-rotate-left"></i></a>'
    }
  ]
});

// ============= on Loading =============
table.on("preXhr.dt", function () {
  $("#historyError").addClass("d-none");
});

// ============= on View =============
table.on("xhr.dt", function () {
  $("#historyError").addClass("d-none");
});

// ============= on Error =============
table.on("error.dt", function (e, settings, techNote, message) {
  console.error("History table error:", message);
  $("#historyError").removeClass("d-none");
});

// ======================= Filters =======================
const reloadTable = createReload(table);
$("#searchInput").on("input", reloadTable);
$("#categoryFilter, #branchFilter, #actionFilter, #fromDate, #toDate").on("change", reloadTable);

$("#fromDate").on("change", function () {
  $("#toDate").attr("min", this.value || "");
});

$("#toDate").on("change", function () {
  const today = $("#fromDate").attr("data-today");
  $("#fromDate").attr("max", this.value || today || "");
});