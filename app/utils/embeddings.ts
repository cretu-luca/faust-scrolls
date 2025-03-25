import * as use from '@tensorflow-models/universal-sentence-encoder';
import { ArxivEntry } from '../types/arxiv';

let model: use.UniversalSentenceEncoder | null = null;

async function loadModel() {
  if (!model) {
    model = await use.load();
  }
  return model;
}

function simplePCA(embeddings: number[][], dimensions: number = 2): number[][] {
  // Center the data
  const mean = embeddings.reduce((acc, row) => {
    return acc.map((val, i) => val + row[i] / embeddings.length);
  }, new Array(embeddings[0].length).fill(0));

  const centered = embeddings.map(row => 
    row.map((val, i) => val - mean[i])
  );

  // Compute covariance matrix
  const covariance = centered.map(row => 
    centered.map(col => 
      row.reduce((sum, val, i) => sum + val * col[i], 0) / (embeddings.length - 1)
    )
  );

  // Simple eigenvalue decomposition (using power iteration)
  const eigenvectors = [];
  for (let i = 0; i < dimensions; i++) {
    let vector = new Array(embeddings[0].length).fill(1);
    for (let iter = 0; iter < 10; iter++) {
      // Matrix multiplication
      const newVector = covariance.map(row => 
        row.reduce((sum, val, j) => sum + val * vector[j], 0)
      );
      
      // Normalize
      const norm = Math.sqrt(newVector.reduce((sum, val) => sum + val * val, 0));
      vector = newVector.map(val => val / norm);
    }
    eigenvectors.push(vector);
  }

  // Project data onto eigenvectors
  return embeddings.map(row => 
    eigenvectors.map(eigenvector => 
      row.reduce((sum, val, i) => sum + val * eigenvector[i], 0)
    )
  );
}

export async function generateEmbeddingsAndCoordinates(articles: ArxivEntry[]): Promise<ArxivEntry[]> {
  try {
    if (articles.length === 0) return articles;

    const model = await loadModel();
    
    const abstracts = articles.map(article => article.abstract);
    const embeddings = await model.embed(abstracts);
    const embeddingsArray = await embeddings.array();

    const coordinates = simplePCA(embeddingsArray);

    const scaleX = 100;
    const scaleY = 100;

    return articles.map((article, i) => ({
      ...article,
      coordinates: {
        x: (coordinates[i][0] - 0.5) * scaleX,
        y: (coordinates[i][1] - 0.5) * scaleY
      }
    }));
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return articles;
  }
}

export function computeDistributedCoordinates(articles: ArxivEntry[], existingCoords: { x: number; y: number }[]): ArxivEntry[] {
  const xCoords = existingCoords.map(c => c.x);
  const yCoords = existingCoords.map(c => c.y);
  
  const minX = Math.min(...xCoords);
  const maxX = Math.max(...xCoords);
  const minY = Math.min(...yCoords);
  const maxY = Math.max(...yCoords);
  
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const spreadX = (maxX - minX) / 2;
  const spreadY = (maxY - minY) / 2;

  return articles.map(article => {
    const u1 = Math.random();
    const u2 = Math.random();
    const radius = Math.sqrt(-2 * Math.log(u1));
    const theta = 2 * Math.PI * u2;
    
    return {
      ...article,
      coordinates: {
        x: centerX + (radius * Math.cos(theta) * spreadX * 0.3),
        y: centerY + (radius * Math.sin(theta) * spreadY * 0.3)
      },
      isTemporary: true
    };
  });
}

export function resolveArticleCoordinates(
  articles: ArxivEntry[],
  existingArticles: ArxivEntry[]
): ArxivEntry[] {
  const existingCoords = existingArticles
    .filter(a => a.coordinates && !isNaN(a.coordinates.x) && !isNaN(a.coordinates.y))
    .map(a => a.coordinates!);

  return articles.map(article => {
    const existing = existingArticles.find(e => e.title === article.title);
    
    if (existing?.coordinates && !article.isTemporary) {
      return {
        ...article,
        coordinates: existing.coordinates
      };
    } else {
      const distributedCoords = computeDistributedCoordinates([article], existingCoords)[0];
      return {
        ...article,
        coordinates: distributedCoords.coordinates,
        isTemporary: true
      };
    }
  });
} 