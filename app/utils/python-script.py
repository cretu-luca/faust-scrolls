import json
import sys
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.manifold import TSNE
import pandas as pd

def process_articles_json(input_json):
    try:
        data = json.loads(input_json)
    except json.JSONDecodeError:
        return json.dumps({"error": "Invalid JSON input"})
    
    df = pd.DataFrame(data)
    
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        abstracts = df['abstract'].tolist()
        embeddings = model.encode(abstracts, show_progress_bar=True)
        
        tsne = TSNE(n_components=2, random_state=42, perplexity=30)
        tsne_embeddings = tsne.fit_transform(embeddings)
        
        json_data = []
        for i, (_, row) in enumerate(df.iterrows()):
            article = {
                'authors': row['authors'],
                'title': row['title'],
                'journal': row['journal-ref'],
                'abstract': row['abstract'],
                'year': row['update_date'],
                'citations': row['citations'],
                'embedding': embeddings[i].tolist(),
                'coordinates': {
                    'x': float(tsne_embeddings[i, 0]),
                    'y': float(tsne_embeddings[i, 1])
                }
            }
            json_data.append(article)
        
        return json.dumps(json_data)
    
    except Exception as e:
        return json.dumps({"error": str(e)})

if __name__ == "__main__":
    input_json = sys.stdin.read()
    
    result_json = process_articles_json(input_json)