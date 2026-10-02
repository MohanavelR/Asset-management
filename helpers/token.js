const jwt=require("jsonwebtoken")
async function generateToken(data){
    try {      
        const token=await jwt.sign(data,process.env.JWT_SECRET_KEY,{expiresIn:process.env.JWT_EXPIRE})
        return token
    } catch (error) {
        throw error
    }
}
function tokenVerify(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
        return null;
    }
}

module.exports={generateToken,tokenVerify}