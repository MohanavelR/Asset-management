const fmt = (d) => (d ? d.split("-").reverse().join("-") : "-");
const esc = (v) => $("<div>").text(v || "-").html();

// ======================= DataTable =======================
const table = $("#returnTable").DataTable({
  serverSide: true,
  processing: true,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  language: dataTableMessages("Returned Assets", "fas fa-box"),
  ajax: {
    url: "/returnsApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.category = $("#categoryFilter").val() || "";
      d.reason = $("#reasonFilter").val() || "";
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
    { data: "returnDate", render: fmt },
    { data: "returnReason", render: (v) => '<span class="badge text-bg-secondary">' + esc(v) + "</span>" },
    { data: "returnRemarks", defaultContent: "-", render: esc }
  ]
});

// ============= on Loading =============
table.on("preXhr.dt", function () {
  $("#returnError").addClass("d-none");
});

// ============= on View =============
table.on("xhr.dt", function () {
  $("#returnError").addClass("d-none");
});

// ============= on Error =============
table.on("error.dt", function () {
  $("#returnError").removeClass("d-none");
});

// ======================= Filters =======================
const reloadTable = createReload(table);
$("#searchInput").on("input", reloadTable);
$("#categoryFilter, #branchFilter, #reasonFilter").on("change", reloadTable);

// ======================= Modal =======================
const returnModalEl = document.getElementById("returnModal");
const returnForm = $("#returnForm");

// ============= Auto Open Modal (/returnAsset?assetId=5) =============
if (returnForm.find("select[name=assetId]").val()) {
  bootstrap.Modal.getOrCreateInstance(returnModalEl).show();
}

// ======================= Save =======================
returnForm.on("submit", async (event) => {
  event.preventDefault();
  const btn = $("#return-save-btn");

  try {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setButtonLoading(btn, true, "Return");

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

      // Remove process assets
      returnForm.find("select[name=assetId] option[value='" + data.assetId + "']").remove();

      bootstrap.Modal.getOrCreateInstance(returnModalEl).hide();
      table.ajax.reload(null, false);
    }
  } catch (error) {
    showToast(error.message || "Something went wrong", "danger");
  } finally {
    setButtonLoading(btn, false, "Return");
  }
});

// ==== When Close Model get Today and set Today============
returnModalEl.addEventListener("hidden.bs.modal", function () {
  const today = returnForm.find("input[name=returnDate]").attr("max");
  returnForm[0].reset();
  returnForm.find("input[name=returnDate]").val(today);
});