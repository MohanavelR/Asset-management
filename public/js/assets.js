const table = $("#assetTable").DataTable({
  serverSide: true,
  processing: false,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  ajax: {
    url: "/assetsApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.status = $("#statusFilter").val() || "";
      d.category = $("#categoryFilter").val() || "";

        
    },
    dataSrc: function (res) {
      return res.data;
    }
  },
  columns: [
    { data: "assetTag" },
    { data: "serial_no" },
    { data: "categoryInfo.name", defaultContent: "-" },
    { data: "make" },
    { data: "model" },
    { data: "branch" },
    {
      data: "status",
      render: function (status) {
        const color = { "In Stock": "success", "Issued": "primary", "Repair": "warning" }[status] || "secondary";
        return `<span class="badge text-bg-${color}">${status}</span>`;
      }
    },
    {
      data: "id",
      orderable: false,
      searchable: false,
      render: (id) => `
        <div class="d-flex gap-1">
          <a href="/assets/view/${id}" class="btn btn-sm btn-outline-info" title="View">
            <i class="fa-solid fa-eye"></i>
          </a>
          <a href="/assets/${id}/edit" class="btn btn-sm btn-outline-primary" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </a>
          <button type="button" class="btn btn-sm btn-outline-danger btn-delete"
                  data-id="${id}" onclick="deleteAsset(${id})" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>`
    }
  ],
  order: []
});

table.on("preXhr.dt", function () {
  $("#assetLoading").removeClass("d-none");
  $("#assetEmpty").addClass("d-none");
  $("#assetError").addClass("d-none");
});

table.on("xhr.dt", function (event, settings, json) {
  $("#assetLoading").addClass("d-none");
  if (!json || !json.data || json.data.length === 0) {
    $("#assetEmpty").removeClass("d-none");
  } else {
    $("#assetEmpty").addClass("d-none");
  }
});

table.on("error.dt", function () {
  $("#assetEmpty").addClass("d-none");
  $("#assetLoading").addClass("d-none");
  $("#assetError").removeClass("d-none");
});

let filterTimer;
function reloadTable() {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(function () {
    table.ajax.reload();
  }, 300);
}

$("#searchInput").on("input", reloadTable);
$("#statusFilter").on("change", reloadTable);
$("#categoryFilter").on("change", reloadTable);