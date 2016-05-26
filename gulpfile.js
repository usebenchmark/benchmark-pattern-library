var gulp = require('gulp');
var runSequence = require('run-sequence');
var livingcss = require('gulp-livingcss');
var less = require('gulp-less');
var LessAutoprefix = require('less-plugin-autoprefix'),
    autoprefix = new LessAutoprefix({ browsers: ['last 2 versions'] });
var LessPluginCleanCSS = require('less-plugin-clean-css'),
    cleanCSSPlugin = new LessPluginCleanCSS({advanced: true});
var connect = require('gulp-connect');
var shell = require('gulp-shell');
var clean = require('gulp-clean');
var confirm = require('gulp-confirm');


gulp.task('library', function () {
  gulp.src('less/*.less')
    .pipe(livingcss({
      loadcss: false,
      template: './library-template/template.hbs',
      preprocess: function(context, template, Handlebars) {
        context.title = 'Benchmark Patterns';
        context.footerHTML = 'Application Patterns for <a href="usebenchmark.com">Benchmark Intelligence</a>';
        return livingcss.utils.readFileGlobs('./dist/app.css', function(data, file) {
          context.stylesheets.push(file);
        });
      }
    }))
    .pipe(gulp.dest('./pattern_library/'));
});

gulp.task('less', function () {
  // App Styles
  gulp.src(['./less/app.less'])
    .pipe(less({
      plugins: [autoprefix, cleanCSSPlugin]
    }))
    .pipe(gulp.dest('./dist/'))
    .pipe(gulp.dest('./pattern_library/dist/'));
  // Pattern Library Styles
  gulp.src(['./library-template/less/library.less'])
    .pipe(less({
      plugins: [autoprefix, cleanCSSPlugin]
    }))
    .pipe(gulp.dest('./pattern_library/css/'));
});

gulp.task('fonts', function () {
  gulp.src([
    './fonts/**/*'
  ])
    .pipe(gulp.dest('./pattern_library/fonts/'));
});

gulp.task('server', function () {
  connect.server({
    root: './pattern_library/',
    port: '7000',
    livereload: true
  });
});

gulp.task('watch', function () {
  gulp.watch([
    './pattern_library/index.html'
  ], function (event) {
    return gulp
      .src(event.path)
      .pipe(connect.reload());
  });
  gulp.watch(['./less/**/*.less'], ['less', 'library']);
  gulp.watch(['./library-template/less/**/*.less'], ['less', 'library']);
  gulp.watch(['./library-template/**/*.hbs'], ['less', 'library']);
});

gulp.task('dev', function(callback) {
  runSequence('less',
              ['library', 'fonts'],
              ['server', 'watch'],
              callback);
});


// DEPLOYMENT TASKS

gulp.task('d-runDeploy', function(callback) {
  runSequence('less',
              ['library', 'fonts'],
              'd-mkBranch',
              'd-removeIgnore',
              'd-deployCode',
              callback)
});
gulp.task('d-mkBranch', shell.task([
  'git checkout -b temp-deploy',
]));
gulp.task('d-removeIgnore', function() {
  return gulp.src('./.gitignore')
    .pipe(clean());
});
gulp.task('d-deployCode', shell.task([
  'git add pattern_library && git commit -m "Deploy Pattern Library"',
  'git subtree push --prefix pattern_library origin gh-pages',
  'git checkout master',
  'git branch -D temp-deploy',
  'git reset --hard HEAD'
]));

gulp.task('deploy', function() {
  gulp.src('gulpfile.js')
    .pipe(confirm({
      question: "Have you committed all your code ('y' or 'n')? \nThis process will run a `git reset --hard HEAD` on your current branch. Always deploy from master.",
      input: '_key:y'
    }))
    .pipe(shell([
      'gulp d-runDeploy'
    ]));
});