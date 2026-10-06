
// DataTable
const table = $("#categoryTable").DataTable({
    serverSide: true,
    processing: true,
    dom: "lrtip",
    pageLength: 10,
    lengthMenu: [10, 25, 50, 100],
    language: dataTableMessages("categories", "fas fa-list"),
    ajax: {
        url: "/asset-categoriesApi",
        data: function (d) {
            d.query = ($("#searchInput").val() || "").trim();
        },
        dataSrc: function (res) {
            return res.data
        }
    },
    columns: [
        { data: null, width: "25px", render: (data, type, row, meta) => `<span>${meta.settings._iDisplayStart + meta.row + 1}</span>` },
        { data: "name", width: "100px", render: (name) => `<span class="fw-semibold">${name}</span>` },
        {
            data: "desc",
            width: "400px",
            render: (desc) => `
        <span class="text-muted w-100  d-block" title="${desc || ""}">
            ${desc || "---"}
        </span>
    `
        },
        {
            data: "createdAt",
            render: (d) => new Date(d).toLocaleDateString("en-IN"),
        },
        {
            data: "id",
            orderable: false,
            searchable: false,
            className: "text-end",
            render: (id, type, category) => `
                   <button
                      type="button"
                      class="btn btn-sm btn-outline-primary btn-edit-category"
                      title="Edit">
                      <i class="fa-solid fa-pen"></i>
                   </button>
                   <button
                       type="button"
                       class="btn btn-sm btn-outline-danger btn-delete"
                       data-id="${id}"
                       onclick="deleteCategory(${id})"
                       title="Delete">
                       <i class="fa-solid fa-trash"></i>
                   </button>
      `,
        },
    ],
    order: []
})

// ========on load==========
table.on("xhr.dt", function (event, settings, json) {
    $("#categoryError").addClass("d-none");
});

//========== on loading=======
table.on("preXhr.dt", function () {
    $("#categoryError").addClass("d-none");
});
// ======error=======

table.on("error.dt", function () {
    $("#categoryError").removeClass("d-none");
});

// ========== Get row Data========== 
table.on("click", ".btn-edit-category", function () {
    const row = table.row($(this).closest("tr")).data()
    editCategory(row)
})

const reloadTable = createReload(table);

$("#searchInput").on("input", reloadTable);


// ====== Category API(create,update)===========
const categoryForm = $("#categoryForm")
categoryForm.on("submit", async (e) => {
    e.preventDefault()
    const nameError = $("#name-error")
    nameError.text("")
    const categorySubmitBtn = $("#categorySubmitBtn")
    try {
        const formData = new FormData(e.currentTarget)
        const name = formData.get("name")
        const desc = formData.get("desc")
        const id = categoryForm.data("id")
        let isValid = true
        if (name.trim() === "") {
            nameError.text(" Name is Required")
            isValid = false
        }
        if (!isValid) {
            setTimeout(() => {
                nameError.text("")
            }, 3000)
            return
        }
        setButtonLoading(categorySubmitBtn, true, "Save");
        const apiUrl = id ? `/asset-categoriesApi/${id}` : "/asset-categoriesApi"
        const response = await fetch(apiUrl, {
            method: id ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name: name.trim(), desc: desc.trim() })
        })

        const res_data = await response.json()
        if (res_data.success) {
            showToast(res_data.message, "success")
            reloadTable()
            bootstrap.Modal.getOrCreateInstance($('#categoryModal')[0]).hide();
        }
        else {
            if (Array.isArray(res_data.errors) && res_data.errors.length) {
                showToasts(res_data.errors.map(e => e.message));
            } else {
                showToast(res_data.message || "Something went wrong", "danger")
            }
        }
    } catch (error) {
        showToast(error.message)
    }
    finally {
        setButtonLoading(categorySubmitBtn, false, "Save");
    }
})
