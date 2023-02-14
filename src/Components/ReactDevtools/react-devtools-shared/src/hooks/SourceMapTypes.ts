import type { EncodedHookMap } from "./generateHookMap";
export type ReactSourceMetadata = [EncodedHookMap | null | undefined];
export type ReactSourcesArray = ReadonlyArray<ReactSourceMetadata | null | undefined>;
export type FBSourceMetadata = [{} | null | undefined, ReactSourceMetadata | null | undefined];
export type FBSourcesArray = ReadonlyArray<FBSourceMetadata | null | undefined>;
export type BasicSourceMap = {
  readonly file?: string;
  readonly mappings: string;
  readonly names: Array<string>;
  readonly sourceRoot?: string;
  readonly sources: Array<string>;
  readonly sourcesContent?: Array<string | null | undefined>;
  readonly version: number;
  readonly x_facebook_sources?: FBSourcesArray;
  readonly x_react_sources?: ReactSourcesArray;
};
export type IndexSourceMapSection = {
  map: IndexSourceMap | BasicSourceMap;
  offset: {
    line: number;
    column: number;
  };
};
export type IndexSourceMap = {
  readonly file?: string;
  readonly mappings?: void;
  // avoids SourceMap being a disjoint union
  readonly sourcesContent?: void;
  readonly sections: Array<IndexSourceMapSection>;
  readonly version: number;
  readonly x_facebook_sources?: FBSourcesArray;
  readonly x_react_sources?: ReactSourcesArray;
};
export type MixedSourceMap = IndexSourceMap | BasicSourceMap;