import assign from "shared/assign";
export function resolveDefaultProps(Component: any, baseProps: Record<string, any>): Record<string, any> {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    const props = assign({}, baseProps);
    const defaultProps = Component.defaultProps;

    for (const propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }

    return props;
  }

  return baseProps;
}