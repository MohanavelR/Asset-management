const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

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


const DATE_FORMATS = {
  1: "YYYY-MM-DD",  
  2: "DD-MM-YYYY",  
  3: "DD MMM YYYY", 
};
const FORMATS = ["YYYY-MM-DD", "DD-MM-YYYY", "DD/MM/YYYY", "DD MMM YYYY"];

function isValidDate(value) {
  return typeof value === "string" && dayjs(value.trim(),FORMATS, true).isValid();
}

function formatDate(value, type = 1) {
  if (value === null || value === undefined || value === "") return null;
  const d = typeof value === "string"
    ? dayjs(value, FORMATS, true)
    : dayjs(value);

  if (!d.isValid()) return null;

  return d.format(DATE_FORMATS[type] || DATE_FORMATS[1]);
}

module.exports={
    cleanString,isEmpty,formatDate,isValidPhone,isValidEmail,cleanArray,isValidDate
}



