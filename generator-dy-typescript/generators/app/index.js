var generators = require('yeoman-generator');

module.exports = generators.Base.extend({
    _fileName: null,
    _projectName: null,
    _compiledDtsFile: null,
    _compiledContentFile: null,

    _copyTpl: function (tplArr) {
        var self = this;

        tplArr.forEach(function (tpl) {
            self.fs.copyTpl(tpl.sourceFile, tpl.destFile, tpl.param);
        });
    },

    prompting: function () {
        var done = this.async(),
            self = this;

        this.prompt({
            type: 'input',
            name: 'projectName',
            message: "what't your projectName?",
            store: true
        }, function (answers) {
            self._projectName = answers.projectName;
            self.prompt({
                type: 'input',
                name: 'fileName',
                message: "what't your fileName?",
                store: true
            }, function (answers) {
                self._fileName = answers.fileName;
                self.prompt({
                    type: 'input',
                    name: 'compiledDtsFiles',
                    message: "what't your lib should be compiled in dist d.ts file(use ',' to separate)?",
                    default: "",
                    store: true
                }, function (answers) {
                    self._compiledDtsFile= answers.compiledDtsFiles;
                    self.prompt({
                        type: 'input',
                        name: 'compiledContentFiles',
                        message: "what't your lib should be compiled in dist .js file(use ',' to separate)?",
                        default: "",
                        store: true
                    }, function (answers) {
                        self._compiledContentFile= answers.compiledContentFiles;
                        done();
                    })
                })
            })
        });
    },
    writing: function () {
        this.mkdir(this.destinationPath("src"));
        this.mkdir(this.destinationPath("dist"));
        this.mkdir(this.destinationPath("lib"));
        this.mkdir(this.destinationPath("lib/external"));
        this.mkdir(this.destinationPath("lib/inner"));
        this.mkdir(this.destinationPath("test/unit"));

        this.fs.copy(
            this.templatePath("./**"),
            this.destinationPath(""),
            {
                globOptions:{
                    dot:true
                }
            }
        );
        this._copyTpl(
            [
                {
                    sourceFile: this.templatePath("gulpfile.js"),
                    destFile: this.destinationPath("gulpfile.js"),
                    param: {
                        fileName: this._fileName,
                        compiledDtsFile: this._compiledDtsFile,
                        compiledContentFile: this._compiledContentFile
                    }
                },
                {
                    sourceFile: this.templatePath("test/karma.conf.js"),
                    destFile: this.destinationPath("test/karma.conf.js"),
                    param: {fileName: this._fileName}
                },
                {
                    sourceFile: this.templatePath("bower.json"),
                    destFile: this.destinationPath("bower.json"),
                    param: {name: this._projectName}
                },
                {
                    sourceFile: this.templatePath("package.json"),
                    destFile: this.destinationPath("package.json"),
                    param: {name: this._projectName}
                }
            ]
        );
    },
    install:function(){
         this.installDependencies({
             bower: true,
             npm: true,
             skipInstall: false,
             callback: function () {
                 console.log('Everything is ready!');
             }
         });
    }
});
