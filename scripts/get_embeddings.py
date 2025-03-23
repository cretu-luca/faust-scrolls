import sys
import json
from sentence_transformers import SentenceTransformer

def get_embeddings(texts):
    # Load the model (will download on first run)
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Generate embeddings
    embeddings = model.encode(texts)
    
    # Convert to list for JSON serialization
    return embeddings.tolist()

if __name__ == "__main__":
    # Read input from stdin
    input_text = sys.stdin.read()
    texts = json.loads(input_text)
    
    # Get embeddings
    embeddings = get_embeddings(texts)
    
    # Write to stdout
    print(json.dumps(embeddings)) 