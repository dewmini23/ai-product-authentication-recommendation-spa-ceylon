import requests
import json

try:
    response = requests.get('http://127.0.0.1:8000/api/products?is_trending=true&limit=2')
    if response.status_code == 200:
        data = response.json()
        print("Count:", len(data))
        if len(data) > 0:
            print("Item 1:", json.dumps(data[0], indent=2))
        else:
            print("No trending products found")
    else:
        print("Error:", response.status_code, response.text)
except Exception as e:
    print("Exception:", e)
