import requests
import os

ES_URL = os.getenv("ELASTICSEARCH_URL", "http://localhost:9200")

indices = ["users", "papers", "projects", "profiles"]

def setup_indices():
    for index in indices:
        print(f"Configuring index: {index}...")
        
        # 1. Check if index exists
        resp = requests.get(f"{ES_URL}/{index}")
        if resp.status_code == 404:
            # Create index with kNN mapping
            mapping = {
                "mappings": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "name": {"type": "text"},
                        "title": {"type": "text"},
                        "content": {"type": "text"},
                        "tags": {"type": "keyword"},
                        "embedding": {
                            "type": "dense_vector",
                            "dims": 768,
                            "index": True,
                            "similarity": "cosine"
                        },
                        "domain": {"type": "keyword"},
                        "institution": {"type": "keyword"},
                        "updated_at": {"type": "date"}
                    }
                }
            }
            create_resp = requests.put(f"{ES_URL}/{index}", json=mapping)
            print(f"Created index {index}: {create_resp.json()}")
        else:
            # Update existing index mapping
            update_mapping = {
                "properties": {
                    "embedding": {
                        "type": "dense_vector",
                        "dims": 768,
                        "index": True,
                        "similarity": "cosine"
                    }
                }
            }
            put_resp = requests.put(f"{ES_URL}/{index}/_mapping", json=update_mapping)
            print(f"Updated mapping for {index}: {put_resp.json()}")

if __name__ == "__main__":
    setup_indices()
