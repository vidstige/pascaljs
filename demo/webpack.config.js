var path = require("path");
module.exports = {
  entry: {
    app: ["./demo.js"]
  },
  output: {
    path: path.resolve(__dirname, "build"),
    publicPath: "/build/",
    filename: "bundle.js"
  }
};
