const HtmlWebpackPlugin = require("html-webpack-plugin");
const https = require("https");
const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

class FetchArtifactsPlugin {
  constructor() {
    this.downloaded = false;
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync(
      "FetchArtifactsPlugin",
      async (params, callback) => {
        if (this.downloaded) {
          callback();
          return;
        }

        const artifactsDir = path.resolve(__dirname, "artifacts");

        if (!fs.existsSync(artifactsDir)) {
          fs.mkdirSync(artifactsDir, { recursive: true });
        }

        console.log("Downloading contract artifacts...");

        try {
          await downloadFile(
            "https://raw.githubusercontent.com/MiragePrivacy/escrow/refs/heads/master/artifacts/bytecode.hex",
            path.join(artifactsDir, "bytecode.hex"),
          );
          console.log("✓ Downloaded bytecode.hex");

          await downloadFile(
            "https://raw.githubusercontent.com/MiragePrivacy/escrow/refs/heads/master/out/Escrow.sol/Escrow.json",
            path.join(artifactsDir, "Escrow.json"),
          );
          console.log("✓ Downloaded Escrow.json");

          this.downloaded = true;
          callback();
        } catch (err) {
          callback(err);
        }
      },
    );
  }
}

module.exports = {
  target: "web",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    clean: true,
  },
  devtool: "source-map",
  plugins: [
    new FetchArtifactsPlugin(),
    new HtmlWebpackPlugin({
      template: "./index.html",
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
  ],
  resolve: {
    fallback: {
      crypto: require.resolve("crypto-browserify"),
      stream: require.resolve("stream-browserify"),
      buffer: require.resolve("buffer/"),
      vm: require.resolve("vm-browserify"),
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, "dist"),
    },
    port: 3000,
  },
  module: {
    rules: [
      {
        test: /\.hex$/,
        type: "asset/resource",
        generator: {
          filename: "artifacts/[name][ext]",
        },
      },
      {
        test: /artifacts\/.*\.json$/,
        type: "asset/resource",
        generator: {
          filename: "artifacts/[name][ext]",
        },
      },
    ],
  },
};
