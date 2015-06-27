var generators = require('yeoman-generator');

module.exports = generators.Base.extend({
    _fileName: null,
    _projectName: null,

    _copyTpl: function (tplArr) {
        var self = this;

        tplArr.forEach(function (tpl) {
            self.fs.copyTpl(tpl.sourceFile, tpl.destFile, tpl.param);
        });
    },

    prompting: function () {
        var done = this.async();
        this.prompt({
            type: 'input',
            name: 'projectName',
            message: "what't your projectName?",
            store:true
        }, function (answers) {
            this._projectName = answers.projectName;
            this.prompt({
                type: 'input',
                name: 'fileName',
                message: "what't your fileName?",
                store:true
            }, function (answers) {
                this._fileName = answers.fileName;
                done();
            }.bind(this));
        }.bind(this));
    },
    writing: function () {
        this.mkdir(this.destinationPath("src"));
        this.mkdir(this.destinationPath("dist"));
        this.mkdir(this.destinationPath("test/unit"));

        this.fs.copy(
            this.templatePath("./"),
            this.destinationPath("")
        );
        this._copyTpl(
            [
                {
                    sourceFile: this.templatePath("gulpfile.js"),
                    destFile: this.destinationPath("gulpfile.js"),
                    param: {fileName: this._fileName}
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
