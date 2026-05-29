export interface BaseItem {
  id: string;
  type: 'text' | 'shape' | 'image' | 'drawing';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // in degrees
  opacity: number; // 0 to 1
  locked: boolean;
  name: string; // Label shown in Layers Panel
}

export interface TextItem extends BaseItem {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string; // 'normal' | 'bold' | '300' etc
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  align: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
}

export interface ShapeItem extends BaseItem {
  type: 'shape';
  shapeType: 'rect' | 'circle' | 'triangle' | 'star' | 'line' | 'pentagon' | 'hexagon';
  fill: string; // Color HEX or gradient
  strokeColor: string;
  strokeWidth: number;
  borderRadius: number; // corner-radius (only for rect)
}

export interface ImageItem extends BaseItem {
  type: 'image';
  src: string; // URL or Base64 string
  aspectRatio: number;
}

export interface DrawingItem extends BaseItem {
  type: 'drawing';
  points: { x: number; y: number }[];
  strokeColor: string;
  strokeWidth: number;
}

export type CanvasItem = TextItem | ShapeItem | ImageItem | DrawingItem;

export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
export type TemplateItem = DistributiveOmit<CanvasItem, 'id'>;

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string; // hex or CSS background value (e.g. gradients)
  zoom: number;
  panX: number;
  panY: number;
}

export interface CanvasState {
  items: CanvasItem[];
  selectedItemId: string | null;
  config: CanvasConfig;
}
