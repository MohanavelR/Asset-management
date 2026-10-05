const money = (v) =>
  Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const table = $("#stockTable").DataTable({
  serverSide: true,
  processing: false,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  ajax: {
    url: "/stockApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.category = $("#categoryFilter").val() || "";
      d.branch = $("#branchFilter").val() || "";
    },
    dataSrc: function (res) { return res.data; }
  },
  columns: [
    { data: "assetTag" },
    { data: "serial_no" },
    { data: "categoryInfo.name", defaultContent: "-" },
    { data: "make" },
    { data: "model" },
    { data: "branch" },
    { data: "acqPrice", className: "text-end", render: (v) => money(v) }
  ]
});

table.on("preXhr.dt", function () {
  $("#stockLoading").removeClass("d-none");
  $("#stockEmpty").addClass("d-none");
  $("#stockError").addClass("d-none");
});

table.on("xhr.dt", function (event, settings, json) {
  $("#stockLoading").addClass("d-none");

  const totals = (json && json.totals) || { total: 0, value: 0 };
  $("#footLabel").text("Total (" + totals.total + " assets in stock)");
  $("#footValue").text(money(totals.value));

  // totals by branch
  const cards = ((json && json.branches) || []).map((b) => `
    <div class="col-lg-3 col-md-4 col-6">
      <div class="border rounded p-2 bg-white">
        <div class="text-muted small">${$("<div>").text(b.branch).html()}</div>
        <div class="fw-semibold">${b.total} assets</div>
        <div class="small">${money(b.value)}</div>
      </div>
    </div>`);
  $("#branchTotals").html(cards.join(""));

  if (!json || !json.data || json.data.length === 0) {
    $("#stockEmpty").removeClass("d-none");
  } else {
    $("#stockEmpty").addClass("d-none");
  }
});

table.on("error.dt", function () {
  $("#stockLoading").addClass("d-none");
  $("#stockEmpty").addClass("d-none");
  $("#stockError").removeClass("d-none");
});

let filterTimer;
function reloadTable() {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(function () { table.ajax.reload(); }, 300);
}
$("#searchInput").on("input", reloadTable);
$("#categoryFilter, #branchFilter").on("change", reloadTable);

$("#resetFilters").on("click", function () {
  $("#searchInput, #categoryFilter, #branchFilter").val("");
  table.ajax.reload();
});