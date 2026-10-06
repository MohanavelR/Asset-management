const fmt = (d) => (d ? d.split("-").reverse().join("-") : "-"); // YYYY-MM-DD -> DD-MM-YYYY
const esc = (v) => $("<div>").text(v || "-").html();

// ======================= DataTable =======================
const table = $("#issueTable").DataTable({
  serverSide: true,
  processing: true,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  language: dataTableMessages( "Issued Assets", "fas fa-box" ),
  ajax: {
    url: "/issuesApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.category = $("#categoryFilter").val() || "";
      d.branch = $("#branchFilter").val() || "";
    },
    dataSrc: function (res) {
      return res.data;
    }
  },
  columns: [
    { data: "asset.assetTag" },
    { data: null, render: (r) => esc(r.asset.make + " " + r.asset.model) },
    { data: null, render: (r) => esc(r.employee.employeeId + " - " + r.employee.name) },
    { data: "issueDate", render: fmt },
    { data: "issueRemarks", defaultContent: "-", render: esc }
  ]
});

// ============= on Loading =============
table.on("preXhr.dt", function () {
  $("#issueError").addClass("d-none");
});

// ======= on View=============
table.on("xhr.dt", function (event, settings, json) {
   $("#issueError").addClass("d-none");
});

// =========== on Error ==============
table.on("error.dt", function () {
  $("#issueError").removeClass("d-none");
});

// ======================= Filters =======================
const reloadTable = createReload(table); 
$("#searchInput").on("input", reloadTable);
$("#categoryFilter, #branchFilter").on("change", reloadTable);


// ======================= Modal =======================
const issueModalEl = document.getElementById("issueModal");
const issueForm = $("#issueForm");

//  =========== Auto Open Model=====================
if (issueForm.find("select[name=assetId]").val()) {
  bootstrap.Modal.getOrCreateInstance(issueModalEl).show();
}

// ======================= Save =======================
issueForm.on("submit", async (event) => {
  event.preventDefault();
  const btn = $("#issue-save-btn");

  try {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setButtonLoading(btn, true, "Issue");
    const response = await fetch("/issueAssetApi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!(response.headers.get("content-type") || "").includes("application/json")) {
      throw new Error("Server returned " + response.status + ". Check the route /issueAssetApi");
    }
    const res_data = await response.json();

    if (!res_data.success) {
      if (Array.isArray(res_data.errors) && res_data.errors.length) {
        showToasts(res_data.errors.map((e) => e.message));
      } else {
        showToast(res_data.message || "Something went wrong", "danger");
      }
    } else {
      showToast(res_data.message || "Asset issued", "success");
      // Remove process assets
      issueForm.find("select[name=assetId] option[value='" + data.assetId + "']").remove();
      
      bootstrap.Modal.getOrCreateInstance(issueModalEl).hide();
      table.ajax.reload(null, false);
    
    }
  } catch (error) {
    showToast(error.message || "Something went wrong", "danger");
  } finally {
   setButtonLoading(btn, false, "Issue");

  }
});
// ==== When Close Model get Today and set Today============
issueModalEl.addEventListener("hidden.bs.modal", function () {
  const today = issueForm.find("input[name=issuedDate]").attr("max");
  issueForm[0].reset();
  issueForm.find("input[name=issuedDate]").val(today);
});