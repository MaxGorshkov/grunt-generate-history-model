"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_file_parser_1 = require("ts-file-parser");
const classmetadata_1 = require("./model/classmetadata");
const fieldmetadata_1 = require("./model/fieldmetadata");
const filemetadata_1 = require("./model/filemetadata");
const nunjucks_1 = require("nunjucks");
const path = require("path");
function makeHistory(grunt) {
    grunt.registerMultiTask("generateHistoryModel", function () {
        var metadata = createMetadatas(this.files, grunt, this);
        createFiles(metadata, grunt);
    });
}
module.exports = makeHistory;
function createMetadatas(files, grunt, obj) {
    var options = obj.options({
        encoding: grunt.file.defaultEncoding,
        processContent: false,
        processContentExclude: [],
        timestamp: false,
        mode: false
    });
    let generationFiles;
    generationFiles = new Array();
    var wasFiled = 0;
    var fileMet;
    var isOneFile = obj.data.oneFile;
    for (var file of files) {
        if (isOneFile) {
            if (fileMet === undefined) {
                fileMet = new filemetadata_1.FileMetadata();
            }
            fileMet.filename = file.orig.dest + "/common.ts";
            if (fileMet.classes === undefined) {
                fileMet.classes = new Array();
            }
        }
        if (!isOneFile) {
            fileMet = new filemetadata_1.FileMetadata();
            fileMet.filename = file.dest;
            fileMet.classes = new Array();
        }
        var stringFile = grunt.file.read(file.src, options);
        var jsonStructure = ts_file_parser_1.parseStruct(stringFile, {}, file.src);
        jsonStructure.classes.forEach(cls => {
            let classMet = new classmetadata_1.ClassMetadata();
            classMet.name = cls.name;
            classMet.fields = new Array();
            cls.decorators.forEach(dec => {
                if (dec.name === "GenerateHistory") {
                    classMet.generateHistory = true;
                }
            });
            if (classMet.generateHistory === false) {
                return;
            }
            cls.fields.forEach(fld => {
                let fldMetadata = new fieldmetadata_1.FieldMetadata();
                if (fld.type.base !== undefined) {
                    fldMetadata.name = fld.name;
                    var skobes = "[]";
                    fldMetadata.isArray = true;
                    fldMetadata.type = fld.type.base.typeName;
                    var curBase = fld.type.base;
                    while (curBase.base !== undefined) {
                        curBase = curBase.base;
                        fldMetadata.type = curBase.typeName;
                        skobes += "[]";
                    }
                    fldMetadata.type += skobes;
                }
                else {
                    fldMetadata.name = fld.name;
                    fldMetadata.type = fld.type.typeName;
                }
                let isDbColumn = false, isIgnoredInHistory = false;
                fld.decorators.forEach(dec => {
                    if (dec.name === "IgnoredInHistory") {
                        isIgnoredInHistory = true;
                    }
                    if (dec.name === "Column") {
                        isDbColumn = true;
                    }
                    if (dec.name === "HistoryIndex") {
                        fldMetadata.generateIndex = true;
                    }
                });
                if (!isDbColumn || isIgnoredInHistory) {
                    fldMetadata.ignoredInHistory = true;
                }
                classMet.fields.push(fldMetadata);
            });
            fileMet.classes.push(classMet);
        });
        if (isOneFile && wasFiled === 0) {
            generationFiles.push(fileMet);
            wasFiled++;
        }
        if (!isOneFile) {
            generationFiles.push(fileMet);
        }
    }
    return generationFiles;
}
function createFiles(metadata, grunt) {
    let viewsFolder = path.resolve(__dirname, "view/");
    nunjucks_1.configure(viewsFolder, { autoescape: true, trimBlocks: true });
    for (var i = 0; i < metadata.length; i++) {
        var mdata = metadata[i];
        mdata.classes = mdata.classes.filter((item) => item.generateHistory);
        var c = nunjucks_1.render("historyTemplateCommon.njk", { metafile: mdata });
        if (c && c.trim()) {
            grunt.file.write(metadata[i].filename, c);
        }
    }
}
//# sourceMappingURL=generateHistoryModel.js.map