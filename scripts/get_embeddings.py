import sys
import json
from sentence_transformers import SentenceTransformer

def get_embeddings(texts):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    embeddings = model.encode(texts)
    
    return embeddings.tolist()

if __name__ == "__main__":
    input_text = sys.stdin.read()
    texts = json.loads(input_text)
    
    embeddings = get_embeddings(texts)