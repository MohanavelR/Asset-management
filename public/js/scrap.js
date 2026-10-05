const esc = (v) => $("<div>").text(v || "-").html();
const fmt = (d) => (d ? d.split("-").reverse().join("-") : "-");

// ======================= DataTable: scrapped assets =======================
const table = $("#scrapTable").DataTable({
  serverSide: true,
  processing: false,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  ajax: {
    url: "/scrapListApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.category = $("#categoryFilter").val() || "";
    },
    dataSrc: function (res) { return res.data; }
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

table.on("preXhr.dt", function () {
  $("#scrapLoading").removeClass("d-none");
  $("#scrapEmpty").addClass("d-none");
  $("#scrapError").addClass("d-none");
});
table.on("xhr.dt", function (e, s, json) {
  $("#scrapLoading").addClass("d-none");
  $("#scrapEmpty").toggleClass("d-none", !!(json && json.data && json.data.length));
});
table.on("error.dt", function () {
  $("#scrapLoading, #scrapEmpty").addClass("d-none");
  $("#scrapError").removeClass("d-none");
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
const scrapModalEl = document.getElementById("scrapModal");
const scrapForm = $("#scrapForm");
const assetSelect = scrapForm.find("select[name=assetId]");

// Re-stock is enabled only for assets in Repair
function syncRestockButton() {
  const status = assetSelect.find("option:selected").data("status");
  $("#restock-btn").prop("disabled", status !== "Returned");
}
assetSelect.on("change", syncRestockButton);

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
    btn.html('<div class="spinner-border spinner-border-sm"></div>').prop("disabled", true);

    const response = await fetch("/scrapAssetApi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const res_data = await response.json();

    if (!res_data.success) {
      if (Array.isArray(res_data.errors) && res_data.errors.length) {
        showToasts(res_data.errors.map((e) => e.message));
      } else {
        showToast(res_data.message || "Something went wrong", "danger");
      }
    } else {
      showToast(res_data.message, "success");
      assetSelect.find("option[value='" + data.assetId + "']").remove();
      bootstrap.Modal.getOrCreateInstance(scrapModalEl).hide();
      table.ajax.reload(null, false);
    }
  } catch (error) {
    showToast(error.message || "Something went wrong", "danger");
  } finally {
    btn.html("Scrap").prop("disabled", false);
  }
});

// ======================= Re-stock =======================
$("#restock-btn").on("click", async function () {
  const assetId = assetSelect.val();
  if (!assetId) return showToast("Please select an asset", "danger");
  if (!confirm("Repair complete? The asset will go back In Stock.")) return;

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
      showToast(res_data.message, "success");
      // the asset is now In Stock: update the option in place
      const opt = assetSelect.find("option:selected");
      opt.data("status", "In Stock").attr("data-status", "In Stock");
      opt.text(opt.text().replace(/- Repair$/, "- In Stock"));
      bootstrap.Modal.getOrCreateInstance(scrapModalEl).hide();
    }
  } catch (error) {
    showToast(error.message || "Something went wrong", "danger");
  } finally {
    syncRestockButton();
  }
});