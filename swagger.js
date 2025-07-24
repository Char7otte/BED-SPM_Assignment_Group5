const swaggerAutogen = require("swagger-autogen")();

const outputFile = "./swagger-output.json";
const routes = ["./app.js"];

const doc = {
    info: {
        title: "The Old People App",
        description: "Super app",
    },
    host: "localhost:3000",
};

swaggerAutogen(outputFile, routes, doc);
