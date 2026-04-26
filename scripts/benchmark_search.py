import time
import requests
import statistics
import concurrent.futures

API_URL = "http://localhost:5000/api/v1/discovery/search"
AUTH_TOKEN = "your_test_token" # Requires a valid token for testing

queries = [
    "deep learning",
    "quantum computing",
    "biotechnology",
    "climate change",
    "robotics"
]

def run_search(query):
    start = time.time()
    try:
        resp = requests.get(
            f"{API_URL}?query={query}",
            headers={"Authorization": f"Bearer {AUTH_TOKEN}"}
        )
        latency = (time.time() - start) * 1000
        return latency
    except Exception as e:
        print(f"Request failed: {e}")
        return None

def benchmark():
    print(f"Starting benchmark with {len(queries)} queries...")
    latencies = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(run_search, queries))
        latencies = [r for r in results if r is not None]

    if latencies:
        print(f"Mean Latency: {statistics.mean(latencies):.2f}ms")
        print(f"P95 Latency: {statistics.quantiles(latencies, n=20)[18]:.2f}ms")
    else:
        print("Benchmark failed: No successful requests.")

if __name__ == "__main__":
    benchmark()
