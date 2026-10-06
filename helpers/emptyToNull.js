const emptyToNull = (field) =>
    function (value) {
        this.setDataValue(field, value === "" || value === undefined ? null : value);
    };
module.exports=emptyToNull    