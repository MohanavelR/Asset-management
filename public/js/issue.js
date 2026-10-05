const fmt = (d) => (d ? d.split("-").reverse().join("-") : "-"); // YYYY-MM-DD -> DD-MM-YYYY
const esc = (v) => $("<div>").text(v || "-").html();

// ======================= DataTable =======================
const table = $("#issueTable").DataTable({
  serverSide: true,
  processing: false,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  ajax: {
    url: "/issuesApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.category = $("#categoryFilter").val() || "";
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

table.on("preXhr.dt", function () {
  $("#issueLoading").removeClass("d-none");
  $("#issueEmpty").addClass("d-none");
  $("#issueError").addClass("d-none");
});

table.on("xhr.dt", function (event, settings, json) {
  $("#issueLoading").addClass("d-none");
  if (!json || !json.data || json.data.length === 0) {
    $("#issueEmpty").removeClass("d-none");
  } else {
    $("#issueEmpty").addClass("d-none");
  }
});

table.on("error.dt", function () {
  $("#issueLoading").addClass("d-none");
  $("#issueEmpty").addClass("d-none");
  $("#issueError").removeClass("d-none");
});

// ======================= Filters =======================
let filterTimer;
function reloadTable() {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => table.ajax.reload(), 300);
}

$("#searchInput").on("input", reloadTable);
$("#categoryFilter").on("change", reloadTable);

$("#resetFilters").on("click", function () {
  $("#searchInput, #categoryFilter").val("");
  table.ajax.reload();
});

// ======================= Modal =======================
const issueModalEl = document.getElementById("issueModal");
const issueForm = $("#issueForm");

// open the modal automatically for /issueAsset?assetId=5
if (issueForm.find("select[name=assetId]").val()) {
  bootstrap.Modal.getOrCreateInstance(issueModalEl).show();
}

// ======================= Save =======================
issueForm.on("submit", async (event) => {
  event.preventDefault();
  const btn = $("#issue-save-btn");

  try {
    const data = Object.fromEntries(new FormData(event.currentTarget));

    btn.html('<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden"></span></div>');
    btn.prop("disabled", true);

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

      // the issued asset is no longer In Stock, so remove it from the dropdown
      issueForm.find("select[name=assetId] option[value='" + data.assetId + "']").remove();

      bootstrap.Modal.getOrCreateInstance(issueModalEl).hide();
      table.ajax.reload(null, false);
    }
  } catch (error) {
    showToast(error.message || "Something went wrong", "danger");
  } finally {
    btn.html("Issue");
    btn.prop("disabled", false);
  }
});

// reset the form each time the modal closes (date goes back to today)
issueModalEl.addEventListener("hidden.bs.modal", function () {
  const today = issueForm.find("input[name=issuedDate]").attr("max");
  issueForm[0].reset();
  issueForm.find("input[name=issuedDate]").val(today);
});