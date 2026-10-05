const fmt = (d) => (d ? d.split("-").reverse().join("-") : "-");
const esc = (v) => $("<div>").text(v || "-").html();

// ======================= DataTable =======================
const table = $("#returnTable").DataTable({
  serverSide: true,
  processing: false,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  ajax: {
    url: "/returnsApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.category = $("#categoryFilter").val() || "";
      d.reason = $("#reasonFilter").val() || "";
    },
    dataSrc: function (res) { return res.data; }
  },
  columns: [
    { data: "asset.assetTag" },
    { data: null, render: (r) => esc(r.asset.make + " " + r.asset.model) },
    { data: null, render: (r) => esc(r.employee.employeeId + " - " + r.employee.name) },
    { data: "issueDate", render: fmt },
    { data: "returnDate", render: fmt },
    { data: "returnReason", render: (v) => '<span class="badge text-bg-secondary">' + esc(v) + "</span>" },
    { data: "returnRemarks", defaultContent: "-", render: esc }
  ]
});

table.on("preXhr.dt", function () {
  $("#returnLoading").removeClass("d-none");
  $("#returnEmpty").addClass("d-none");
  $("#returnError").addClass("d-none");
});

table.on("xhr.dt", function (event, settings, json) {
  $("#returnLoading").addClass("d-none");
  if (!json || !json.data || json.data.length === 0) {
    $("#returnEmpty").removeClass("d-none");
  } else {
    $("#returnEmpty").addClass("d-none");
  }
});

table.on("error.dt", function () {
  $("#returnLoading").addClass("d-none");
  $("#returnEmpty").addClass("d-none");
  $("#returnError").removeClass("d-none");
});

// ======================= Filters =======================
let filterTimer;
function reloadTable() {
  clearTimeout(filterTimer);
  filterTimer = setTimeout(() => table.ajax.reload(), 300);
}
$("#searchInput").on("input", reloadTable);
$("#categoryFilter, #reasonFilter").on("change", reloadTable);

$("#resetFilters").on("click", function () {
  $("#searchInput, #categoryFilter, #reasonFilter").val("");
  table.ajax.reload();
});

// ======================= Modal =======================
const returnModalEl = document.getElementById("returnModal");
const returnForm = $("#returnForm");

// open automatically for /returnAsset?assetId=5
if (returnForm.find("select[name=assetId]").val()) {
  bootstrap.Modal.getOrCreateInstance(returnModalEl).show();
}

// ======================= Save =======================
returnForm.on("submit", async (event) => {
  event.preventDefault();
  const btn = $("#return-save-btn");

  try {
    const data = Object.fromEntries(new FormData(event.currentTarget));

    btn.html('<div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden"></span></div>');
    btn.prop("disabled", true);

    const response = await fetch("/returnAssetApi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!(response.headers.get("content-type") || "").includes("application/json")) {
      throw new Error("Server returned " + response.status + ". Check the route /returnAssetApi");
    }
    const res_data = await response.json();

    if (!res_data.success) {
      if (Array.isArray(res_data.errors) && res_data.errors.length) {
        showToasts(res_data.errors.map((e) => e.message));
      } else {
        showToast(res_data.message || "Something went wrong", "danger");
      }
    } else {
      showToast(res_data.message || "Asset returned", "success");

      // no longer issued, so remove it from the dropdown
      returnForm.find("select[name=assetId] option[value='" + data.assetId + "']").remove();

      bootstrap.Modal.getOrCreateInstance(returnModalEl).hide();
      table.ajax.reload(null, false);
    }
  } catch (error) {
    showToast(error.message || "Something went wrong", "danger");
  } finally {
    btn.html("Return");
    btn.prop("disabled", false);
  }
});

// reset the form each time the modal closes (date goes back to today)
returnModalEl.addEventListener("hidden.bs.modal", function () {
  const today = returnForm.find("input[name=returnDate]").attr("max");
  returnForm[0].reset();
  returnForm.find("input[name=returnDate]").val(today);
});