import { $ReadOnly } from "utility-types";
export type BoxStyle = $ReadOnly<{
  bottom: number;
  left: number;
  right: number;
  top: number;
}>;
export type Layout = {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  top: number;
  margin: BoxStyle;
  padding: BoxStyle;
};
export type Style = Record<string, any>;
export type StyleAndLayout = {
  id: number;
  style: Style | null;
  layout: Layout | null;
};