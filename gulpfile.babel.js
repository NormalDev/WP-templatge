import gulp from "gulp";
import yargs from "yargs";
import sass from "gulp-sass";
import cleanCss from "gulp-clean-css";
import gulpif from "gulp-if";
import postcss from "gulp-postcss";
import sourcemaps from "gulp-sourcemaps";
import autoprefixer from "autoprefixer";
import imagemin from "gulp-imagemin";
import del from "del";
import webpack from "webpack-stream";
import uglify from "gulp-uglify";
import browserSync from "browser-sync";
import info from "./package.json";
import named from "vinyl-named";
const PRODUCTION = yargs.argv.prod;

const server = browserSync.create();

//paths
const paths = {
  styles: {
    src: ["./src/assets/scss/style.scss", "./src/assets/scss/admin.scss"],
    dest: "./dist/assets/css",
  },
  images: {
    src: "./src/assets/images/**/*.{jpg,jpeg,png,svg,gif}",
    dest: "./dist/assets/images",
  },
  scripts: {
    src: ["./src/assets/js/main.js", "./src/assets/js/admin.js"],
    dest: "./dist/assets/js",
  },
  other: {
    src: [
      "./src/assets/**/*",
      "!src/assets/{images,js,scss}",
      "!src/assets/{images,js,scss}/**/*",
    ],
    dest: "dist/assets",
  },
};

//Compile sass in css and move to production folder
export const styles = () => {
  return gulp
    .src(paths.styles.src)
    .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
    .pipe(sass().on("error", sass.logError))
    .pipe(gulpif(PRODUCTION, postcss([autoprefixer])))
    .pipe(gulpif(PRODUCTION, cleanCss({ compatibility: "ie8" })))
    .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(server.stream());
};

//Refresh every time a change is saved in folder
export const watch = () => {
  gulp.watch("./src/assets/scss/**/*.scss", styles);
  gulp.watch("./src/assets/js/**/*.js", gulp.series(scripts, reload));
  gulp.watch(
    "./src/assets/images/**/*.{jpg,jpeg,png,svg,gif}",
    gulp.series(images, reload)
  );
  gulp.watch(paths.images.src, gulp.series(scripts, reload));
  gulp.watch("./**/*.php", reload);
  gulp.watch(paths.other.src, reload);
};

//Compreses images and move to production folder
export const images = () => {
  return gulp
    .src(paths.images.src)
    .pipe(gulpif(PRODUCTION, imagemin()))
    .pipe(gulp.dest(paths.images.dest));
};

//Copy every other file in the production directory
export const copy = () => {
  return gulp.src(paths.other.src).pipe(gulp.dest(paths.other.dest));
};

//Remove the distriburion folder when building
export const clean = () => {
  return del(["dist"]);
};

//WebPack compilation
export const scripts = () => {
  return gulp
    .src(paths.scripts.src)
    .pipe(named())
    .pipe(
      webpack({
        module: {
          rules: [
            {
              test: /\.js$/,
              use: {
                loader: "babel-loader",
                options: {
                  presets: ["@babel/preset-env"],
                },
              },
            },
          ],
        },
        mode: PRODUCTION ? "production" : "development",
        devtool: !PRODUCTION ? "inline-source-map" : false,
        output: {
          filename: "[name].js",
        },
        externals: {
          jquery: "jQuery",
        },
      })
    )
    .pipe(gulpif(PRODUCTION, uglify()))
    .pipe(gulp.dest(paths.scripts.dest));
};

//BrowserSync refresh
export const serve = (done) => {
  server.init({
    proxy:
      "C:/Users/Martino/Desktop/Programmazione/Templates/template-monster/index.php",
  });
  done();
};
export const reload = (done) => {
  server.reload();
  done();
};

//Development and building tasks
export const dev = gulp.series(
  clean,
  gulp.parallel(styles, images, scripts, copy),
  serve,
  watch
);
export const build = gulp.series(
  clean,
  gulp.parallel(styles, images, scripts, copy)
);
