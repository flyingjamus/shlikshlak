import type { BasicSourceMap, MixedSourceMap, IndexSourceMap } from "./SourceMapTypes";
export function sourceMapIncludesSource(sourcemap: MixedSourceMap, source: string | null | undefined): boolean {
  if (source == null) {
    return false;
  }

  if (sourcemap.mappings === undefined) {
    const indexSourceMap: IndexSourceMap = sourcemap;
    return indexSourceMap.sections.some(section => {
      return sourceMapIncludesSource(section.map, source);
    });
  }

  const basicMap: BasicSourceMap = sourcemap;
  return basicMap.sources.some(s => s === 'Inline Babel script' || source.endsWith(s));
}