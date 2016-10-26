var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: __dirname + '/public',
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', ''],
  },
  module: {
    loaders: [
      { test: /\.tsx?$/, loaders: ['ts-loader'] },
    ]
  },
  devServer: {
    inline: true,
    contentBase: './public',
  },
  externals: {
    "react": "React",
    "react-dom": "ReactDOM"
  },
}
