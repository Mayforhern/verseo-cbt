from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import requests
import json

app = Flask(__name__)
CORS(app)

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv('GROQ_API_KEY')

# In-memory conversation history
conversation_history = []

@app.route('/')
def home():
    return "Groq Chat API is running!"

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        if not GROQ_API_KEY:
            return jsonify({
                'error': 'Groq API key is not configured',
                'details': 'Please set GROQ_API_KEY in your .env file'
            }), 500

        data = request.json
        print("Received request data:", data)
        
        user_message = data.get('message', '')
        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        print(f"Processing message: {user_message}")

        # Groq API endpoint
        url = "https://api.groq.com/openai/v1/chat/completions"
        
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json"
        }

        # Prepare messages with system message and conversation history
        messages = [
            {
                "role": "system",
                "content": "You are a helpful AI assistant. You provide clear, concise, and accurate responses. Keep your responses natural and conversational. If you're not sure about something, be honest about it."
            }
        ]
        
        # Add conversation history
        messages.extend(conversation_history)
        
        # Add current user message
        messages.append({"role": "user", "content": user_message})
        
        payload = {
            "model": "llama-3.2-1b-preview",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000
        }

        print("Sending request to Groq API...")
        response = requests.post(url, json=payload, headers=headers)
        print(f"Groq API response status: {response.status_code}")
        
        if response.status_code == 200:
            response_data = response.json()
            print("Groq API response:", response_data)
            bot_message = response_data['choices'][0]['message']['content']
            
            # Update conversation history
            conversation_history.append({"role": "user", "content": user_message})
            conversation_history.append({"role": "assistant", "content": bot_message})
            
            # Keep only the last 10 messages to prevent context from growing too large
            if len(conversation_history) > 10:
                conversation_history.pop(0)
                conversation_history.pop(0)
            
            return jsonify({"response": bot_message})
        else:
            error_message = f"API Error: {response.text}"
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            return jsonify({"error": error_message}), response.status_code

    except Exception as e:
        error_message = str(e)
        print(f"Exception: {error_message}")
        return jsonify({"error": error_message}), 500

if __name__ == '__main__':
    print("Starting Flask server...")
    print("GROQ_API_KEY:", GROQ_API_KEY[:10] + "..." if GROQ_API_KEY else "Not set")
    app.run(debug=True) 