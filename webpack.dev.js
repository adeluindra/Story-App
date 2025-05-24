const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map', // Better debugging
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          }
        ],
      },
    ],
  },
  devServer: {
    static: [
      {
        directory: path.resolve(__dirname, 'dist'),
        publicPath: '/'
      }
    ],
    port: 9000,
    host: 'localhost',
    hot: true, // Enable hot module replacement
    open: true, // Open browser automatically
    historyApiFallback: true, // Support for SPA routing
    compress: true,
    client: {
      overlay: {
        errors: true,
        warnings: false, // Hide warnings overlay
      },
      logging: 'info'
    },
    // Headers for proper MIME types
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
    },
    // Middleware for serving files with correct MIME types
    setupMiddlewares: (middlewares, devServer) => {
      devServer.app.use((req, res, next) => {
        if (req.url.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        } else if (req.url.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
        next();
      });
      return middlewares;
    }
  },
});