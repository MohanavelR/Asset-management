
const table=$("#employeeTable").DataTable({
   serverSide:true,
   processing:true,
   dom:"lrtip",
   pageLength:10,
   lengthMenu:[10,25,50,100],
   language: {
    processing: `
            <div class="py-3 text-center">
                <div class="spinner-border text-primary" role="status"></div>
                <div class="mt-2 text-muted">Loading employees...</div>
            </div>
        `,

        emptyTable: `
            <div class="py-4 text-center text-muted">
                <i class="fa-solid fa-users-slash fs-3 mb-2"></i>
                <div>No employees found</div>
            </div>
        `,

        zeroRecords: `
            <div class="py-4 text-center text-muted">
                <i class="fa-solid fa-magnifying-glass fs-3 mb-2"></i>
                <div>No matching employees found</div>
            </div>
        `,

   },
   ajax:{
    url:"/employeesApi",
    data:function(d){
     d.query = ($("#searchInput").val() || "").trim();  
    d.status = $("#statusFilter").val() || "";    
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
     render:function(status){
        const isActive=status==="Active" ? "success"
                        : "secondary";
        return ` <span class="badge text-bg-${isActive}">
                        ${status}
                    </span>`
     }   
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

// onview
table.on("xhr.dt", function (event, settings, json) {
      $("#employeeError").addClass("d-none");
})
// onLoading 
table.on("preXhr.dt", function () {
      $("#employeeError").addClass("d-none");

});
// Error
table.on("error.dt", function () {
  $("#employeeError").removeClass("d-none");
});

let filterTimer;
function reloadTable() {

    clearTimeout(filterTimer);

    filterTimer = setTimeout(function () {

        table.ajax.reload();

    }, 300);    
}
$("#searchInput").on("input", function () {
    reloadTable();
});
$("#statusFilter").on("change", function () {
    reloadTable();
});