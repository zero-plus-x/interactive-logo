import gulp from 'gulp';
import plugins from 'gulp-load-plugins';

const $$ = plugins();

import del from 'del';
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';

import cfg from './build.config';
import wpCfg from './webpack.config.babel';

gulp.task('default', ['watch']);

gulp.task('watch', () => {
  var config = Object.create(wpCfg);
  config.entry.index.unshift('webpack-dev-server/client?http://localhost:8080/');

  // Start a webpack-dev-server
  new WebpackDevServer(webpack(config), {
    stats: {
      colors: true
    }
  }).listen(8080, 'localhost', function(err) {
    if (err) throw new $$.util.PluginError('webpack-dev-server', err);
    $$.util.log('[webpack-dev-server]', 'http://localhost:8080/');
  });
});

gulp.task('build', (cb) => {
  webpack(wpCfg, (err, stats) => {
    if (err) throw new $$.util.PluginError('webpack', err);
    $$.util.log('[webpack]', stats.toString({
      colors: true,
      progress: true
    }));
    cb();
  });
});

gulp.task('clean', () => {
  // TODO move path to config
  return del('./dist');
});

gulp.task('lint', ['lint:code', 'lint:style', 'lint:template']);

gulp.task('code:lint', ['lint:code']);
gulp.task('lint:code', () => {
  return gulp.src(cfg.code.src, {base: './'})
    .pipe($$.plumber({
      errorHandler: $$.notify.onError(err => ({
        title: 'Code Lint',
        message: err.message
      }))
    }))
    .pipe($$.cached('lint:code'))
    .pipe($$.eslint({ configFile: cfg.ext.eslint }))
    .pipe($$.eslint.format())
    .pipe($$.eslint.failAfterError());
});

gulp.task('style:lint', ['lint:style']);
gulp.task('lint:style', function() {
  return gulp.src(cfg.style.src)
    .pipe($$.plumber({
      errorHandler: $$.notify.onError(err => ({
        title: 'Style Lint',
        message: err.message
      }))
    }))
    .pipe($$.cached('lint:style'))
    .pipe($$.sassLint())
    .pipe($$.sassLint.format())
    .pipe($$.sassLint.failOnError());
});

gulp.task('template:lint', ['lint:template']);
gulp.task('lint:template', function() {
  return gulp.src([cfg.template.src, cfg.template.main])
    .pipe($$.plumber({
      errorHandler: $$.notify.onError(err => ({
        title: 'Template Lint',
        message: err.message
      }))
    }))
    .pipe($$.cached('lint:template'));

    /*
    temporarly disabled html5Lint, because bumping into the following error:

    /node_modules/gulp-html5-lint/lib/gulp-html5-lint.js:59
      _.forEach(results.messages, function(msg) {
                                 ^
      TypeError: Cannot read property 'messages' of undefined

    they seem to fix it in https://github.com/LiveSafe/gulp-html5-lint/issues/4
    but it still repdoducable with the latest version — needs investigation TODO
    */
    // .pipe($$.html5Lint());
});
