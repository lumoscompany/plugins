const NodePlugin = require('node-polyfill-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const path = require('path');

module.exports = {
  entry: './source/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules|packages/,
      },
    ],
    parser: {
      javascript: {
        dynamicImportMode: 'lazy',
      },
    },
  },
  target: 'web',
  watch: false,
  resolve: {
    modules: ['node_modules', 'src', 'build', 'source'], // This one is required for `tronweb`.
    extensions: ['.ts', '.js'],
    symlinks: false,
  },
  plugins: [new NodePlugin()],
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          format: { comments: false },
        },
      }),
    ],
  },
  output: {
    strictModuleErrorHandling: true,
    path: path.resolve(__dirname, 'bundle'),
    globalObject: 'globalThis',
    library: {
      type: 'commonjs2',
    },
    filename: 'index.js',
  },
};
