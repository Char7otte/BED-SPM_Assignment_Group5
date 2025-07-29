function validateID(id) {
    if (isNaN(id) || id <= 0) return false;
    return true;
}

module.exports = {
    validateID,
};
