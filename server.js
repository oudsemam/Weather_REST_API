//require the Express Module
const express = require("express");
const routes = require("./routes");

//create an instant of an express server
const app = express();

app.use("/", routes);

//define the port
const port = 3000;

//run the server
app.listen(port, () => console.log(`Listening on port: ${port}`));
