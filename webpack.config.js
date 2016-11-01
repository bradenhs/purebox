var path = require('path');

module.exports = {
  context: path.join(__dirname, '/src2'),
  entry: {
    'index': './index.ts',
    'react/index': './react/index.ts'
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', ''],
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    loaders: [
      { test: /\.ts$/, loader: 'ts-loader' }
    ]
  }
}