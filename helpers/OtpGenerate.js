// const crypto= require("crypto")
// function OTPGenerate(length){
//     const len =  Number("1".padEnd(length+1,"0"))
//     console.log(len)
//     const otp = Math.floor(Math.random()*len)
//     return otp
// }

const crypto = require("crypto");

function generateOTP(length = 6) {
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += crypto.randomInt(0, 10)
  }
  return otp;
}

module.exports=generateOTP