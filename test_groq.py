import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get API key from environment variable
api_key = os.getenv('GROQ_API_KEY')

# API endpoint for listing models
url = "https://api.groq.com/openai/v1/models"

# Headers for the request
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

try:
    # Make the request
    response = requests.get(url, headers=headers)
    
    # Print the status code and response
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
    
except Exception as e:
    print(f"Error: {str(e)}") 