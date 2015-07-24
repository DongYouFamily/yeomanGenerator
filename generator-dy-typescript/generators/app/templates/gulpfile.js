var gulp = require("gulp");
var gulpTs = require("gulp-typescript");
var gulpSourcemaps = require("gulp-sourcemaps");
var gulpConcat = require("gulp-concat");
var del = require("del");
var gulpSync = require("gulp-sync")(gulp);
var merge = require("merge2");
var path = require("path");
var fs = require("fs-extra");

var tsFilePaths = [
    "src/*.ts",
    "src/**/*.ts"
];
var distPath = "dist";

gulp.task("clean", function() {
    return del.sync([distPath], {
        force: true
    });
});

gulp.task("compileTs", function() {
    var tsResult = gulp.src(tsFilePaths)
        .pipe(gulpTs({
            declarationFiles: true,
            target: "ES5",
            sortOutput:true,
            //out: "<%= fileName %>.js"
            typescript: require("typescript")
        }));


    return  merge([
        tsResult.dts
            .pipe(gulpConcat("<%= fileName %>.d.ts"))
            .pipe(gulp.dest(distPath)),
        tsResult.js
            .pipe(gulpConcat("<%= fileName %>.js"))
            .pipe(gulp.dest(distPath))
    ])
});

gulp.task("compileTsDebug", function() {
    var tsResult = gulp.src(tsFilePaths)
        .pipe(gulpSourcemaps.init())
        .pipe(gulpTs({
            declarationFiles: true,
            target: "ES5",
            sortOutput:true,
            typescript: require("typescript")
        }));

    return tsResult.js
        .pipe(gulpConcat("<%= fileName %>.js"))
        .pipe(gulpSourcemaps.write())
        .pipe(gulp.dest(distPath));
});

var combineDTsList = "<%= compiledDtsFile %>".split(","),
    combineContentList = "<%= compiledContentFile %>".split(",");
var definitionsPath = "src/definitions.d.ts";

gulp.task("combineDefinitionFile", function(done){
    combineInnerLibDTs(
        path.join(distPath, "<%= fileName %>.d.ts"),
        path.join(process.cwd(), definitionsPath),
        function(innerLibDtsPath){
            var result = false;

            combineDTsList.forEach(function(dts){
                if(innerLibDtsPath.indexOf(dts) > -1){
                    result = true;
                }
            });

            return result;
        }
    );

    done();
});

gulp.task("combineContent", function(done){
    combineInnerLibContent(
        path.join(distPath, "<%= fileName %>.js"),
        path.join(process.cwd(), definitionsPath),
        filterFunc
    );

    createInnerLibJs();

    done();
});

function createInnerLibJs(){
    fs.createFileSync( path.join(distPath, "<%= fileName %>.innerLib.js") );

    combineInnerLibContent(
        path.join(distPath, "<%= fileName %>.innerLib.js"),
        path.join(process.cwd(), definitionsPath),
        filterFunc
    );
}

function filterFunc(innerLibDtsPath){
    var result = false;

    combineContentList.forEach(function(dts){
        if(innerLibDtsPath.indexOf(dts) > -1){
            result = true;
        }
    });

    return result;
}

function combineInnerLibDTs(mainFilePath, definitionDTsPath, filterFunc){
    getInnerLibDTsPathArr(definitionDTsPath)
        .filter(filterFunc)
        .forEach(function(innerLibDtsPath){
            fs.writeFileSync(
                mainFilePath,
                fs.readFileSync(innerLibDtsPath, "utf8")
                + "\n"
                + fs.readFileSync(mainFilePath, "utf8")
            );
        });
}
function combineInnerLibContent(mainFilePath, definitionDTsPath, filterFunc){
    getInnerLibDTsPathArr(definitionDTsPath)
        .filter(filterFunc)
        .forEach(function(innerLibDtsPath){
            fs.writeFileSync(
                mainFilePath,
                fs.readFileSync(innerLibDtsPath.replace("d.ts", "js"), "utf8")
                + "\n"
                + fs.readFileSync(mainFilePath, "utf8")
            );
        });
}

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

    //to make finial file is build based on definitions.d.ts"s sequence
    return resultArr.reverse();
}

function parseInnerLibDTsPath(pathInDefinitionFile){
    return path.join(process.cwd(), pathInDefinitionFile.slice(3));
}

gulp.task("combineInnerLib", gulpSync.sync(["combineDefinitionFile","combineContent"]));


//todo removeReference
gulp.task("build", gulpSync.sync(["clean", "compileTs", "compileTsDebug",  "combineInnerLib"]));






var karma = require("karma").server;
var karmaConfPath = path.join(process.cwd(), "test/karma.conf.js");



//gulp.task("test", gulpSync.sync(["build"]), function (done) {
//    karma.start({
//        configFile: karmaConfPath
//    }, done);
//});

gulp.task("test", function (done) {
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

//var testFilePaths = ["test/unit/*Spec.js", "test/unit/**/*Spec.js"];
//
//gulp.task("watch", function(){
//    gulp.watch(tsFilePaths.concat(testFilePaths), ["singleTest"]);
//});

gulp.task("watch", function(){
    gulp.watch(tsFilePaths, ["compileTsDebug"]);
});
