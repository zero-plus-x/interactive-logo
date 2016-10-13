import path from 'path';
import webpack from 'webpack';
import browserslist from 'browserslist';
import autoprefixer from 'autoprefixer';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import cfg from './build.config';

const IS_DEVELOPMENT = process.env.NODE_ENV !== 'production';
const IS_GLOBAL = process.env.DISTRIBUTION === 'global';
const rootPath = path.join(__dirname, cfg.src.root);
const outputPath = path.join(__dirname, cfg.src.output);
const texturesPath = path.join(__dirname, cfg.src.textures);
const modelsPath = path.join(__dirname, cfg.src.models);
const fontsPath = path.join(__dirname, cfg.src.fonts);
const config = {
  context: rootPath,
  entry: {
    index: [
      IS_DEVELOPMENT || IS_GLOBAL
        ? './index.global'
        : './index'
    ]
  },
  output: {
    path: outputPath,
    publicPath: '/',
    filename: '[name].js',
    libraryTarget: IS_DEVELOPMENT ? 'var' : 'commonjs2'
  },
  resolve: {
    extensions: ['.js', '.scss']
  },
  devtool: IS_DEVELOPMENT ? false : 'source-map',
  plugins: [
    new webpack.LoaderOptionsPlugin({
      options: {
        sassLoader: {
          data: `$is_development: ${IS_DEVELOPMENT};`
        },
        postcss: [autoprefixer({
          browsers: browserslist(null, {
            path: cfg.ext.browserslist
          })
        })],
        debug: IS_DEVELOPMENT,

        // temporary until the following issues wouldn't be resolved:
        // - https://github.com/bholloway/resolve-url-loader/issues/33
        // - https://github.com/webpack/webpack/issues/3018
        context: rootPath,
        output: {
          path: outputPath
        }
      }
    }),
    new webpack.NoErrorsPlugin(),
    new webpack.DefinePlugin({
      IS_DEVELOPMENT: JSON.stringify(IS_DEVELOPMENT)
    }),
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true,
      disable: !IS_GLOBAL
    })
  ],
  module: {
    loaders: [{
      test: /\.scss$/,
      include: rootPath,
      loader: IS_DEVELOPMENT
        ? 'style!css!resolve-url!sass'
        : ExtractTextPlugin.extract('css?minimize!postcss!resolve-url!sass')
    }, {
      test: /\.view.html/,
      loader: 'html-loader'
    }]
  },
  devServer: {
    watchOptions: {
      aggregateTimeout: 100
    },
    contentPath: 'dist/',
    historyApiFalback: true
  }
};

if (!IS_DEVELOPMENT) {
  config.module.loaders.push({
    test: /\.(png|jpg|svg|ttf|eot|woff|woff2|json)$/,
    loader: 'url-loader?limit=30000&name=[path][name].[ext]'
  }, {
    test: /\.js$/,
    include: rootPath,
    loader: 'babel'
  });
  config.plugins.push(
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false,
          'drop_console': true,
          unsafe: true
        }
      })
  );
} else {
  config.module.loaders.push({
    test: /\.(png|jpg|svg|ttf|eot|woff|woff2)$/,
    include: texturesPath,
    loader: 'file-loader?name=[path][name].[ext]'
  }, {
    test: /\.(png|jpg|svg|ttf|eot|woff|woff2)$/,
    exclude: texturesPath,
    loader: 'url-loader?limit=10000&name=[path][name].[ext]'
  }, {
    test: /\.json/,
    include: modelsPath,
    loader: 'file-loader?name=[path][name].[ext]'
  }, {
    test: /\.json/,
    include: fontsPath,
    loader: 'file-loader?name=[path][name].[ext]'
  });
}

if (IS_DEVELOPMENT || IS_GLOBAL) {
  config.plugins.push(
    new HtmlWebpackPlugin({
      inject: true,
      template: 'index.html',
      minify: IS_DEVELOPMENT ? false : {
        includeAutoGeneratedTags: true,
        collapseWhitespace: true
      }
    })
  );
}

export default config;
