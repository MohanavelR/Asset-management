const table = $("#assetTable").DataTable({
  serverSide: true,
  processing: true,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  language: dataTableMessages("assets", "fas fa-box"),
  ajax: {
    url: "/assetsApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.status = $("#statusFilter").val() || "";
      d.category = $("#categoryFilter").val() || "";
      d.branch=($("#branchFilter").val()|| "" ).trim()
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

// =================on Loading============
table.on("preXhr.dt", function () {
  $("#assetError").addClass("d-none");
});

// =================on View============
table.on("xhr.dt", function (event, settings, json) {
  $("#assetError").addClass("d-none");
});

// ============Error===================
table.on("error.dt", function () {
   $("#assetError").removeClass("d-none");
 
});

// ================ Reload Table and Manage debounce ================
const reloadTable = createReload(table); 

$("#searchInput").on("input", reloadTable);
$("#categoryFilter,#branchFilter,#statusFilter").on("change", reloadTable);