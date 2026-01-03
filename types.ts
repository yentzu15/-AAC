
export interface AACTile {
  id: string;
  text: string;
  imageUrl: string;
}

export interface AACBoard {
  id: string;
  name: string;
  tiles: AACTile[];
}

export type LayoutMode = 'standard' | 'edit';

export interface AIEditResponse {
  success: boolean;
  imageData?: string;
  error?: string;
}
