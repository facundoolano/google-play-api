const express = require("express");
const router = require("./lib");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use("/api/", router);
app.use(express.static(path.join(__dirname, ".")));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "./public/index.html")); 
});

app.listen(port, function () {
  console.log("Server started on port", port);
});
