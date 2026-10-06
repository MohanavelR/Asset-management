
function generateId(flag, lastId, padLength = 3) {
    let nextNumber = 1;

    if (lastId) {
        const match = String(lastId).match(/\d+$/);
        if (match) nextNumber = parseInt(match[0], 10) + 1;
    }

    return flag + String(nextNumber).padStart(padLength, "0");
}

module.exports = generateId;