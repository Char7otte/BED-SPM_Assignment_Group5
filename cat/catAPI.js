const axios = require("axios");

const options = {
    headers: {
        "x-api-key": process.env.CAT_KEY,
    },
};

async function getCatImg(req, res) {
    const limit = req.params.limit || "10";
    if (limit > 10) limit = 10;
    const response = await axios.get(`https://api.thecatapi.com/v1/images/search?limit=${limit}`, options);
    console.log(response.data);
    const data = response.data;
    return res.render("cat/cat.ejs", { data });
}

module.exports = {
    getCatImg,
};
