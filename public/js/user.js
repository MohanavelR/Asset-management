const esc = (v) => $("<div>").text(v || "-").html();

// ======================= DataTable =======================
const table = $("#userTable").DataTable({
  serverSide: true,
  processing: true,
  ordering: false,
  dom: "lrtip",
  pageLength: 10,
  lengthMenu: [10, 25, 50, 100],
  language: dataTableMessages("Employees", "fas fa-users"),
  ajax: {
    url: "/userManageApi",
    data: function (d) {
      d.query = ($("#searchInput").val() || "").trim();
      d.branch = $("#branchFilter").val() || "";
      d.userStatus = $("#userStatusFilter").val() || "";
    },
    dataSrc: function (res) {
      return res.data;
    }
  },
  columns: [
    { data: "employeeId", render: esc },
    { data: "name", render: esc },
    { data: null, render: (r) => esc(r.department + " - " + r.designation) },
    { data: "branch", render: esc },
    {
      data: "user",
      defaultContent: "-",
      render: (user) => (user ? '<span class="badge text-bg-secondary">' + esc(user.role) + "</span>" : "-")
    },
    {
      data: null,
      className: "text-center",
      render: (r) => {
        if (r.user) {
          const active = r.user.isActive;
          return (
            '<button type="button" class="btn btn-sm ' +
            (active ? "btn-success" : "btn-danger") +
            ' user-status-btn" data-id="' + r.user.id + '">' +
            (active ? "Active" : "Inactive") +
            "</button>"
          );
        }
        return (
          '<button type="button" class="btn btn-sm btn-primary user-set-btn" data-id="' +
          r.id + '" data-name="' + esc(r.employeeId + " - " + r.name) + '">' +
          '<i class="fas fa-user-plus me-1"></i>Set</button>'
        );
      }
    }
  ]
});

// ============= on Loading =============
table.on("preXhr.dt", function () {
  $("#userError").addClass("d-none");
});

// ============= on View =============
table.on("xhr.dt", function () {
  $("#userError").addClass("d-none");
});

// ============= on Error =============
table.on("error.dt", function () {
  $("#userError").removeClass("d-none");
});

// ======================= Filters =======================
const reloadTable = createReload(table);
$("#searchInput").on("input", reloadTable);
$("#branchFilter, #userStatusFilter").on("change", reloadTable);

// ======================= Status Update =======================
$("#userTable").on("click", ".user-status-btn", async function () {
  const btn = $(this);
  const id = btn.data("id");
  const isActive = btn.text().trim() === "Active";
  if (!confirm("Are you sure you want to " + (isActive ? "deactivate" : "activate") + " this user?")) {
    return;
  }
  
  btn.prop("disabled", true);
  
  try {
    const response = await fetch("/userManage/" + id + "/statusApi", {
      method: "PATCH"
    });

    const res_data = await response.json();

    if (!res_data.success) {
      showToast(res_data.message || "Something went wrong", "danger");
    } else {
      showToast(res_data.message || "Status updated", "success");
      table.ajax.reload(null, false);
    }
  } catch (error) {
    showToast(error.message || "Something went wrong", "danger");
  } finally {
    btn.prop("disabled", false);
  }
});

// ======================= Modal =======================
const userModalEl = document.getElementById("userModal");
const userForm = $("#userForm");

// open modal from the Set button
$("#userTable").on("click", ".user-set-btn", function () {
  userForm[0].reset();
  userForm.find(".error-text").text("");
  userForm.find("input[name=employeeId]").val($(this).data("id"));
  $("#userModalEmployee").text($(this).data("name"));

  bootstrap.Modal.getOrCreateInstance(userModalEl).show();
});

// clear form when the modal closes
userModalEl.addEventListener("hidden.bs.modal", function () {
  userForm[0].reset();
  userForm.find(".error-text").text("");
});

// ======================= Save =======================
userForm.on("submit", async (event) => {
  event.preventDefault();
  const btn = $("#user-save-btn");
  const formData = new FormData(event.currentTarget);

  // ===== Validation =====
  let isValid = true;
  const userNameError = $("#userName-error");
  const passwordError = $("#password-error");
  const roleError = $("#role-error");

  userNameError.text("");
  passwordError.text("");
  roleError.text("");

  if ((formData.get("userName") || "").trim() === "") {
    userNameError.text("This is Required");
    isValid = false;
  }
  if ((formData.get("password") || "").trim() === "") {
    passwordError.text("This is Required");
    isValid = false;
  }
  if ((formData.get("role") || "").trim() === "") {
    roleError.text("This is Required");
    isValid = false;
  }
  if(!isValid){
    setTimeout(()=>{
        userNameError.text("");
        passwordError.text("");
        roleError.text("");
    },3000)
    return
  }

  try {
    const data = Object.fromEntries(formData);
    setButtonLoading(btn, true, "Create");

    const response = await fetch("/userManage/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!(response.headers.get("content-type") || "").includes("application/json")) {
      throw new Error("Server returned " + response.status + ". Check the route /userManage/create");
    }
    const res_data = await response.json();

    if (!res_data.success) {
      if (Array.isArray(res_data.errors) && res_data.errors.length) {
        showToasts(res_data.errors.map((e) => e.message));
      } else {
        showToast(res_data.message || "Something went wrong", "danger");
      }
    } else {
      showToast(res_data.message || "User created", "success");
      bootstrap.Modal.getOrCreateInstance(userModalEl).hide();
      table.ajax.reload(null, false);
    }
  } catch (error) {
    showToast(error.message || "Something went wrong", "danger");
  } finally {
    setButtonLoading(btn, false, "Create");
  }
});