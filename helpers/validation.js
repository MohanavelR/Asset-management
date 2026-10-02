function cleanString(s){
  return typeof s==="string"? s.trim():""
}

function isEmpty (value){
    return value===null || value===undefined || cleanString(value)===""
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return /^[6-9][0-9]{9}$/.test(phone);
}
function cleanArray(value) {
  if (typeof value === "string") {
    value = value.trim();

    try {
      value = JSON.parse(value);
    } catch (error) {
      try {
        value = JSON.parse(
          value
            .replace(/\\/g, "")
            .replace(/'/g, '"')
        );
      } catch (error) {
        return [];
      }
    }
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.replace(/\\/g, "").trim();
      }

      return item;
    })
    .filter((item) => item !== null && item !== undefined && item !== "");
}

module.exports={
    cleanString,isEmpty,isValidPhone,isValidEmail,cleanArray
}



