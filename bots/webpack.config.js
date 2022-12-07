const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: {
    exec: __dirname + "/src/exec/index.js",
    propose: __dirname + "/src/propose/index.js",
  },
  target: "node",
  mode: "production",
  devtool: "cheap-module-source-map",
  module: {
    rules: [{ test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ }],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  externals: [
    // all deps available in autotask env
    /axios/,
    /apollo-client/,
    /defender-[^\-]+-client/,
    /ethers/,
    /web3/,
    /@ethersproject\/.*/,
    /aws-sdk/,
    /aws-sdk\/.*/,
  ],
  externalsType: "commonjs2",
  plugins: [
    // list here all deps that are not run in the Autotask environment
    new webpack.IgnorePlugin({ resourceRegExp: /dotenv/ }),
  ],
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    library: { type: "commonjs2" },
  },
};
