const esc = (v) => $("<div>").text(v || "-").html();
const fmt = (d) => (d ? d.split("-").reverse().join("-") : "-"); // YYYY-MM-DD -> DD-MM-YYYY

// ======================= DataTable =======================
const table = $("#scrapTable").DataTable({
  serverSide: true,
  processing: true,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  language: dataTableMessages("Scrapped Assets", "fas fa-box"),
  ajax: {
    url: "/scrapListApi",
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
    { data: "assetTag" },
    { data: "serial_no", render: esc },
    { data: "categoryInfo.name", defaultContent: "-", render: esc },
    { data: null, render: (r) => esc(r.make + " " + r.model) },
    { data: "branch", render: esc },
    { data: "scrappedDate", render: fmt },
    { data: "scrapReason", render: esc },
    { data: "scrapRemarks", defaultContent: "-", render: esc }
  ]
});

// ============= on Loading =============
table.on("preXhr.dt", function () {
  $("#scrapError").addClass("d-none");
});

// ============= on View =============
table.on("xhr.dt", function () {
  $("#scrapError").addClass("d-none");
});

// ============= on Error =============
table.on("error.dt", function () {
  $("#scrapError").removeClass("d-none");
});

// ======================= Filters =======================
const reloadTable = createReload(table);
$("#searchInput").on("input", reloadTable);
$("#categoryFilter, #branchFilter").on("change", reloadTable);

// ======================= Modal =======================
const scrapModalEl = document.getElementById("scrapModal");
const scrapForm = $("#scrapForm");
const assetSelect = scrapForm.find("select[name=assetId]");

// Re-stock is enabled only for assets with status "Returned"
function syncRestockButton() {
  const status = assetSelect.find("option:selected").data("status");
  console.log(status)
  $("#restock-btn").prop("disabled", status !== "Returned");
}
assetSelect.on("change", syncRestockButton);

// ==== When the modal closes, reset the form and set today's date ====
scrapModalEl.addEventListener("hidden.bs.modal", function () {
  const today = scrapForm.find("input[name=scrappedDate]").attr("max");
  scrapForm[0].reset();
  scrapForm.find("input[name=scrappedDate]").val(today);
  syncRestockButton();
});

// ======================= Scrap =======================
scrapForm.on("submit", async (event) => {
  event.preventDefault();
  if (!confirm("Scrap this asset? It will be hidden everywhere except this list and reports.")) return;

  const btn = $("#scrap-save-btn");

  try {
    const data = Object.fromEntries(new FormData(event.currentTarget));
    setButtonLoading(btn, true, "Scrap");

    const response = await fetch("/scrapAssetApi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!(response.headers.get("content-type") || "").includes("application/json")) {
      throw new Error("Server returned " + response.status + ". Check the route /scrapAssetApi");
    }
    const res_data = await response.json();

    if (!res_data.success) {
      if (Array.isArray(res_data.errors) && res_data.errors.length) {
        showToasts(res_data.errors.map((e) => e.message));
      } else {
        showToast(res_data.message || "Something went wrong", "danger");
      }
    } else {
      showToast(res_data.message || "Asset scrapped", "success");

       // Remove process assets
      assetSelect.find("option[value='" + data.assetId + "']").remove();

      bootstrap.Modal.getOrCreateInstance(scrapModalEl).hide();
      table.ajax.reload(null, false);
    }
  } catch (error) {
    showToast(error.message || "Something went wrong", "danger");
  } finally {
    setButtonLoading(btn, false, "Scrap");
  }
});

// ======================= Re-stock =======================
$("#restock-btn").on("click", async function () {
  const assetId = assetSelect.val();
  if (!assetId) {
    return showToast("Please select an asset", "danger");
  }
  if (!confirm("Repair complete? The asset will go back In Stock.")){
    return;
  }

  const btn = $(this);

  try {
    btn.prop("disabled", true);

    const response = await fetch("/restockAssetApi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetId })
    });
    const res_data = await response.json();
    if (!res_data.success) {
      showToast(res_data.message || "Something went wrong", "danger");
    } else {
      showToast(res_data.message || "Asset re-stocked", "success");
      const opt = assetSelect.find("option:selected");
      opt.data("status", "In Stock").attr("data-status", "In Stock");
      opt.text(opt.text().replace(/- [^-]+$/, "- In Stock"));

      bootstrap.Modal.getOrCreateInstance(scrapModalEl).hide();
    }
  } catch (error) {
    showToast(error.message || "Something went wrong", "danger");
  } finally {
    syncRestockButton();
  }
});