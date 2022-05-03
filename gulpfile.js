const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify");
const less = require("gulp-less");
const cleanCSS = require("gulp-clean-css");
const concat = require('gulp-concat');

const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const browserify = require("browserify");
const babel = require("babelify");

const replace =  require("gulp-replace");
const gulppug = require('gulp-pug');
// const webpHtmlNoSvg = ('gulp-webp-html-nosvg');
// const versionNumber = ('gulp-version-number');

const browsersync = require("browser-sync");
const del = require("del");
const versionNumber = require("gulp-version-number");

//Путь к папке с результатом
const buildFolder = './dist';
//Путь к папке с исходниками
const srcFolder = './src';

const nodePath = require('path');
const rootFolder = nodePath.basename(nodePath.resolve());

;
const paths = {
  pug: {
    watchFiles: "./**/*.pug",
    source: [
      "./src/pug/*.pug",
      "./index.pug"
    ]
    
  },
  less: {
    watchFiles: "src/styles/*.less",
    source: [
      "src/styles/*.less"
    ],
    destMapFolder: "./maps"
  },
  js: {
    watchFiles: "src/js/*.js",
    source: [
      "node_modules/@babel/polyfill/dist/polyfill.min.js",
      "src/js/index.js"
    ],
    destMapFolder: "./maps"
  },
  copy: {
    watchFiles:"src/files/**/*.*",
    source: ["src/files/**/*.*"]
  },
  build: {
    destBuildFolder: "dist",
    destMinCSSFileName: "bundle.min.css",
    destMinJSFileName: "bundle.min.js"
  },
  server: {
    
  }
}


gulp.task("server" , (done) => {
  browsersync.init({
    server: {
      baseDir: `${paths.build.destBuildFolder}`
    },
    port: 3000,
  });
  done();
});

gulp.task("pug", (done) => {
  gulp.src(paths.pug.source)
  .pipe(gulppug({pretty: true}))
  .pipe(replace(/@img\//g, "img/"))
  .pipe(versionNumber({
    'value':'%DT%',
    'append': {
        'key': '_v',
        'cover': 0,
        'to': [
            'css',
            'js',
        ]
    },
    'output': {
        'file': 'version.json'
    }
  }))
  .pipe(gulp.dest(paths.build.destBuildFolder))
  .pipe(browsersync.stream());

  done();
});

gulp.task("less", (done) => {
  gulp.src(paths.less.source)
    .pipe(buffer())
    .pipe(sourcemaps.init())
    .pipe(less({ strictMath: true })) // .pipe(gulp.dest(paths.less.destCSSFolder)) // if for some reason css is needed, then uncomment this
    .pipe(cleanCSS({ debug: true }))
    .pipe(concat(paths.build.destMinCSSFileName))
    .pipe(sourcemaps.write(paths.less.destMapFolder))
    .pipe(replace(/@img\//g, "img/"))
    .pipe(gulp.dest(paths.build.destBuildFolder))
    .pipe(browsersync.stream());

  done();
});

gulp.task("js", (done) => {
  const bundler = browserify({ entries: paths.js.source }, { debug: true }).transform(babel);
  bundler.bundle()
    .on("error", function (err) { console.error(err); this.emit("end"); })
    .pipe(source(paths.build.destMinJSFileName))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write(paths.js.destMapFolder))
    .pipe(replace(/@img\//g, "img/"))
    .pipe(gulp.dest(paths.build.destBuildFolder))
    .pipe(browsersync.stream());
  done();
})

gulp.task("copyf" , (done) => {
  gulp.src(paths.copy.source)
  .pipe(gulp.dest(`${paths.build.destBuildFolder}/files/`));

  done();
});


gulp.task("clean", () => del(paths.build.destBuildFolder));





function watchFiles() {
  gulp.watch(paths.js.watchFiles, gulp.series("js"));
  gulp.watch(paths.less.watchFiles, gulp.series("less"));
  gulp.watch(paths.pug.watchFiles, gulp.series("pug"));
  gulp.watch(paths.copy.watchFiles, gulp.series("copyf"));

}

const mainTasks = gulp.series("clean", "copyf" , "less", "js" , "pug" , gulp.parallel("server" , watchFiles ));

gulp.task("watch", gulp.series(watchFiles));
gulp.task("default",  mainTasks );
