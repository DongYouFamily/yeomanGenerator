var gulp = require('gulp');
var gulpTs = require('gulp-typescript');
var gulpSourcemaps = require('gulp-sourcemaps');
var gulpConcat = require('gulp-concat');
var del = require('del');
var gulpSync = require('gulp-sync')(gulp);
var merge = require('merge2');
var path = require('path');
var fs = require("fs");

var tsFilePaths = [
    'src/*.ts',
    'src/**/*.ts'
];
var distPath = "dist";

gulp.task('clean', function() {
    return del.sync([distPath], {
        force: true
    });
});

gulp.task('compileTs', function() {
    var tsResult = gulp.src(tsFilePaths)
        .pipe(gulpSourcemaps.init())
        .pipe(gulpTs({
            declarationFiles: true,
            target: 'ES5',
            sortOutput:true,
            //out: '<%= fileName %>.js'
            typescript: require('typescript')
        }));


    return  merge([
        tsResult.dts
            .pipe(gulpConcat('<%= fileName %>.d.ts'))
            .pipe(gulp.dest(distPath)),
        tsResult.js
            .pipe(gulpConcat('<%= fileName %>.js'))
            .pipe(gulpSourcemaps.write('./'))
            .pipe(gulp.dest(distPath))
    ])
});


gulp.task("combineInnerLib", function(done){
    var mainFilePath = path.join(process.cwd(), "dist/<%= fileName %>.js"),
        definitionDTsPath = path.join(process.cwd(), "src/definitions.d.ts");

    getInnerLibDTsPathArr(definitionDTsPath).forEach(function(innerLibDtsPath){
        fs.writeFileSync(
            mainFilePath,
            fs.readFileSync(innerLibDtsPath.replace("d.ts", "js"), "utf8")
            + "\n"
            + fs.readFileSync(mainFilePath, "utf8")
        );
    });

    done();
});

function getInnerLibDTsPathArr(definitionDTsPath){
    var regex = /"[^"]+\.d\.ts"/g,
        content = null,
        result = null,
        resultArr = [];

    content = fs.readFileSync(definitionDTsPath, "utf8");

    while((result = regex.exec(content)) !== null){
        resultArr.push(
            parseInnerLibDTsPath(result[0].slice(1, -1))
        );
    }

    return resultArr;
}

function parseInnerLibDTsPath(pathInDefinitionFile){
    return path.join(process.cwd(), pathInDefinitionFile.slice(3));
}

gulp.task("build", gulpSync.sync(["clean", "compileTs", "combineInnerLib"]));






var karma = require("karma").server;
var karmaConfPath = path.join(process.cwd(), "test/karma.conf.js");



gulp.task("test", gulpSync.sync(["build"]), function (done) {
    karma.start({
        configFile: karmaConfPath
    }, done);
});


//ci test(single test)

//todo if test failed, the "singleTest" task will error and it will log error info!how to eliminate it?
//reference:https://github.com/lazd/gulp-karma-test, https://github.com/lazd/gulp-karma/issues/21

gulp.task("singleTest", gulpSync.sync(["build"]), function (done) {
    karma.start({
        configFile: karmaConfPath,
        singleRun:true
    }, done);
});

var testFilePaths = ["test/unit/*Spec.js", "test/unit/**/*Spec.js"];

gulp.task("watch", function(){
    gulp.watch(tsFilePaths.concat(testFilePaths), ["singleTest"]);
});

