
      $("#logout-btn").on("click",async()=>{
       
         try{
         const isOk=confirm("Are sure Logout?")
         if(isOk){
           const res= await fetch("/logoutApi",{
            method:"POST",
            headers:{
               "Context-Type":"application/json"
            }
           })
           const res_data=await res.json()
           
           showToast(res_data.message,res_data?.success)
           if(res_data.success){
            window.location.replace("/")
           }
         }
         }
         catch(error){
            showToast(error.message)
         }
      })         
   