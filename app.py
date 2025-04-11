from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from groq import Groq
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize Groq client
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
client = Groq(api_key=GROQ_API_KEY)

@app.route('/')
def home():
    return jsonify({"status": "API is running"})

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        data = request.json
        message = data.get('message')
        
        if not message:
            return jsonify({'error': 'No message provided'}), 400

        logger.info(f"Received request data: {data}")
        logger.info(f"Processing message: {message}")

        # Call Groq API
        logger.info("Sending request to Groq API...")
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant that provides clear, accurate, and engaging responses."
                },
                {
                    "role": "user",
                    "content": message
                }
            ],
            model="llama-3.2-1b-preview",
        )

        logger.info(f"Groq API response received")
        
        response = chat_completion.choices[0].message.content
        return jsonify({'response': response})

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print("Starting Flask server...")
    print(f"GROQ_API_KEY: {GROQ_API_KEY[:10]}..." if GROQ_API_KEY else "Not set")
    app.run(host='0.0.0.0', port=port) 