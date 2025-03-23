export interface ArxivEntry {
  authors: string;
  title: string;
  journal: string;
  abstract: string;
  year: string;
  citations: number;
  coordinates?: {
    x: number;
    y: number;
  };
  isTemporary?: boolean;
} 