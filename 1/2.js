function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
var _ls_getProgram;
import ts from "typescript";
// import ts from 'typescript/built/local/typescript.js'
// import { JsxEmit, ModuleKind, ModuleResolutionKind, ScriptTarget, CompilerOptions } from 'typescript'
export var COMPILER_OPTIONS = {
    allowJs: false,
    allowSyntheticDefaultImports: true,
    allowNonTsExtensions: true,
    alwaysStrict: true,
    esModuleInterop: false,
    forceConsistentCasingInFileNames: false,
    isolatedModules: true,
    jsx: ts.JsxEmit.Preserve,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    // noEmit: false,
    noEmit: true,
    resolveJsonModule: false,
    strict: true,
    skipLibCheck: false,
    // noLib: true,
    target: ts.ScriptTarget.ESNext,
    lib: [
        "dom",
        "dom.iterable",
        "esnext"
    ]
};
// const filename = 'src/Components/Inspector/InspectorTree.tsx'
var filename = "1/1.tsx";
var LanguageServiceHost = /*#__PURE__*/ function() {
    "use strict";
    function LanguageServiceHost(options, cwd) {
        _classCallCheck(this, LanguageServiceHost);
        this._versions = new Map();
        this._snapshots = new Map();
        this._fileNames = new Set();
        this._compileOptions = options;
        this._cwd = cwd;
        this._fileNames.add(filename);
    }
    var _proto = LanguageServiceHost.prototype;
    _proto.getCompilationSettings = function getCompilationSettings() {
        return this._compileOptions;
    };
    _proto.getScriptFileNames = function getScriptFileNames() {
        return _toConsumableArray(this._fileNames.values());
    };
    _proto.getScriptVersion = function getScriptVersion(fileName) {
        return (this._versions.get(fileName) || 0).toString();
    };
    _proto.setScriptSnapshot = function setScriptSnapshot(fileName, code) {
        this._fileNames.add(fileName);
        var version = (this._versions.get(fileName) || 0) + 1;
        this._versions.set(fileName, version);
        var snapshot = ts.ScriptSnapshot.fromString(code);
        this._snapshots.set(fileName, snapshot);
    };
    _proto.getScriptSnapshot = function getScriptSnapshot(fileName) {
        if (this._snapshots.has(fileName)) {
            return this._snapshots.get(fileName);
        }
        var code = ts.sys.readFile(fileName);
        if (code !== undefined) {
            this.setScriptSnapshot(fileName, code);
            return this._snapshots.get(fileName);
        }
    };
    _proto.getCurrentDirectory = function getCurrentDirectory() {
        return this._cwd;
    };
    _proto.getDefaultLibFileName = function getDefaultLibFileName(opts) {
        return ts.getDefaultLibFilePath(opts);
    };
    _proto.fileExists = function fileExists(path) {
        return ts.sys.fileExists(path);
    };
    _proto.readFile = function readFile(path, encoding) {
        return ts.sys.readFile(path, encoding);
    };
    _proto.readDirectory = function readDirectory(path, extensions, exclude, include, depth) {
        return ts.sys.readDirectory(path, extensions, exclude, include, depth);
    };
    _proto.directoryExists = function directoryExists(dirName) {
        return ts.sys.directoryExists(dirName);
    };
    _proto.getDirectories = function getDirectories(dirName) {
        return ts.sys.getDirectories(dirName);
    };
    return LanguageServiceHost;
}();
var ls = ts.createLanguageService(new LanguageServiceHost(COMPILER_OPTIONS, ""));
var sourceFile = (_ls_getProgram = ls.getProgram()) === null || _ls_getProgram === void 0 ? void 0 : _ls_getProgram.getSourceFile(filename);
if (sourceFile) {
    var pos = sourceFile.getPositionOfLineAndCharacter(11, 24);
    console.time("get");
    // console.profile('get')
    var completions = ls.getCompletionsAtPosition(filename, pos, {});
    // console.profileEnd('get')
    // console.profile('get2')
    ls.getCompletionsAtPosition(filename, pos, {});
    ls.getCompletionsAtPosition(filename, pos, {});
    ls.getCompletionsAtPosition(filename, pos, {});
    console.timeEnd("get");
    // console.profileEnd('get2')
    console.log(completions === null || completions === void 0 ? void 0 : completions.entries.map(function(v) {
        return v.name;
    }));
}


//# sourceMappingURL=2.js.map