
const table=$("#employeeTable").DataTable({
   serverSide:true,
   processing:true,
   dom:"lrtip",
   pageLength:10,
   lengthMenu:[10,25,50,100],
   language: dataTableMessages( "employees", "fa-solid fa-users-slash" ),
   ajax:{
    url:"/employeesApi",
    data:function(d){
     d.query = ($("#searchInput").val() || "").trim();  
     d.status = $("#statusFilter").val() || ""; 
    d.branch = $("#branchFilter").val() || "";   
    },
    dataSrc:function(res){
      return res.data
    }
   },
   columns:[
    { data: "employeeId" },
    { data: "name" },
    { data: "email" },
    { data: "phone" },
    { data: "department" },
    { data: "designation" },
    { data: "branch" },
    {data:"status",
     render:renderStatus 
    },
    {
    data: "id",
    orderable: false,
    searchable: false,
    render: (id) => `
        <div class="d-flex gap-1">
             <a
               href="/employee/view/${id}"
               class="btn btn-sm btn-outline-info">
               <i class="fa-solid fa-eye"></i>
             </a>

            <a
              href="/employees/update/${id}"
              class="btn btn-sm btn-outline-primary">
              <i class="fa-solid fa-pen"></i>
            </a>

            <button
                type="button"
                class="btn btn-sm btn-outline-danger btn-delete"
                data-id="${id}"
                onclick="deleteEmployee(${id})"
                
                title="Delete">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `    
}
   ],
   order:[]
})

// =============onview==================
table.on("xhr.dt", function (event, settings, json) {
      $("#employeeError").addClass("d-none");
})

// =================onLoading============
table.on("preXhr.dt", function () {
      $("#employeeError").addClass("d-none");

});

// ============Error===================
table.on("error.dt", function () {
  $("#employeeError").removeClass("d-none");
});


// ================ Reload Table and Manage debounce ================

const reloadTable = createReload(table); 


$("#searchInput").on("input", function () {
    reloadTable();
});

$("#statusFilter, #branchFilter").on("change", reloadTable);