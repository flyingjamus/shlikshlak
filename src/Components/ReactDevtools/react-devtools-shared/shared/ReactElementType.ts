export type Source = {
  fileName: string;
  lineNumber: number;
};
export type ReactElement = {
  $$typeof: any;
  type: any;
  key: any;
  ref: any;
  props: any;
  // ReactFiber
  _owner: any;
  // __DEV__
  _store: {
    validated: boolean;
  };
  _self: React.ReactElement<React.ComponentProps<any>, any>;
  _shadowChildren: any;
  _source: Source;
};