typeof $.fn.DataTable
const table=$("#employeeTable").DataTable({
   serverSide:true,
   processing:false,
   dom:"lrtip",
   pageLength:10,
   lengthMenu:[10,25,50,100],
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
   $("#employeeLoading").addClass("d-none")
   if(!json || !json.data|| json?.data?.length===0){
      $("#employeeEmpty").removeClass("d-none");
   }
   else{
    $("#employeeEmpty").addClass("d-none");
   }
})
// onLoading 
table.on("preXhr.dt", function () {
      $("#employeeLoading").removeClass("d-none")
      $("#employeeEmpty").addClass("d-none");
      $("#employeeError").addClass("d-none");

});


table.on("error.dt", function () {
  $("#employeeEmpty").addClass("d-none");
  $("#employeeLoading").addClass("d-none")
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