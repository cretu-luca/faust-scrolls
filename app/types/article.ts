// this is new
export interface Coordinates {
    x: number;
    y: number;
}

export interface Article {
    authors: string; 
    title: string; 
    journal: string; 
    abstract: string; 
    year: number; 
    citations: number; 
    coordinates: Coordinates;
    embedding?: number[];
    index: number;
    id?: string;
}