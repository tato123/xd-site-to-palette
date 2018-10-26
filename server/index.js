const puppeteer = require("puppeteer");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const getColors = require("get-image-colors");
const cors = require('cors')

const https = require("https");
const fs = require("fs");
const options = {
  key: fs.readFileSync(path.resolve(__dirname, "./localhost.key")),
  cert: fs.readFileSync(path.resolve(__dirname, "./localhost.crt"))
};

const app = express();
app.use(cors({
    origin:true
}))

app.use(bodyParser.json());

const port = process.env.PORT || 3000;

app.get("/image", async (req, res) => {
  const url =  req.query.url && decodeURIComponent(req.query.url);

  if (!url) {
    return res.send(400, 'a url query param is required')
  }

  const file = path.resolve(
    __dirname,
    "./tmp",
    Math.floor(Math.random() * 10000) + ".png"
  );
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);
  const result = await page.screenshot({ path: file, encoding: "binary" });

  await browser.close();
  getColors(result, "image/png")
    .then(colors => {
      // `colors` is an array of color objects

      res.send(200, colors);
    })
    .catch(error => {
      res.send(400, "error" + error.message);
    });
});

app.use("/", express.static(path.resolve(__dirname, "./public")));




https.createServer(options, app).listen(port, () => {
  console.log("app listening on ", port);
});
