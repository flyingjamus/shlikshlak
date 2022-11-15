import S from "subsecond";
import globby from "globby";
import { promises } from "fs";
var readFile = promises.readFile, writeFile = promises.writeFile;
var paths = await globby([
    "node_modules/@mui/**/*.d.ts"
]);
import { Node, Project } from "ts-morph";
var project = new Project({
    skipAddingFilesFromTsConfig: true
});
project.addSourceFilesAtPaths("node_modules/@mui/**/*.d.ts");
project.getSourceFiles().map(function(file) {
    var ref;
    return (ref = file.getExportedDeclarations().get("Box")) === null || ref === void 0 ? void 0 : ref.map(function(v) {
        console.log(12123123, v.getSourceFile().getBaseName(), file.getImportDeclarations().map(function(v) {
            return v.getText();
        }));
        return Node.isReferenceFindable(v) && v.findReferences();
    });
}).filter(Boolean);
// const paths = await globby(['1/*.d.ts'])
// noinspection TypeScriptUnresolvedFunction
var map = new Map();
var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
try {
    for(var _iterator = paths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
        var path = _step.value;
        map.set(path, await readFile(path, "utf8"));
    }
} catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
} finally{
    try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
        }
    } finally{
        if (_didIteratorError) {
            throw _iteratorError;
        }
    }
}
var files = Object.fromEntries(map.entries());
S.load(files) // noinspection TypeScriptUnresolvedFunction
 // const changedFilenames = new Set<string>()
 // S('TSTypeAliasDeclaration TSMappedType').each((v) => {
 //   // console.log(v.fileName())
 //   // console.log(111111, v.children().eq(1).text())
 //   // console.log(
 //   //   113231,
 //   //   v.find('TSTypeParameter').text(),
 //   //   111111,
 //   //   v.find('TSTypeParameter').children().eq(1).text(),
 //   //   111111,
 //   //   v.find('TSQualifiedName').text()
 //   // )
 //   const constraint = v.children().eq(1)
 //   const alias = v.find('TSTypeParameter').children().eq(0).text()
 //   const references = v.find('TSTypeReference').filter((v) => v.text() === alias)
 //   if (references.length) return
 //   changedFilenames.add(v.fileName())
 //
 //   console.log(v.fileName(), '\n')
 //
 //   console.log(v.parent().text())
 //   v.text(`Record<${v.find('TSTypeParameter').children().eq(1).text()}, ${constraint.text()}>`)
 //   console.log(v.parent().text())
 //   console.log('\n---------\n\n')
 // })
 //
 // const newFiles = S.print()
 //
 // for (const filename of changedFilenames) {
 //   console.log(filename)
 //   // await writeFile(filename, newFiles[filename])
 // }
 // console.log(changedFilenames.values())
;


//# sourceMappingURL=2.js.map