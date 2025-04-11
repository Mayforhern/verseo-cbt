from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
from groq import Groq
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize Groq client
GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY is not set!")
else:
    logger.info(f"GROQ_API_KEY is set (starts with: {GROQ_API_KEY[:10]}...)")

client = Groq(api_key=GROQ_API_KEY)

@app.route('/')
def home():
    api_status = "API Key Present" if GROQ_API_KEY else "API Key Missing"
    return jsonify({
        "status": "API is running",
        "api_key_status": api_status,
        "environment": {k: v for k, v in os.environ.items() if k.startswith('GROQ_')}
    })

@app.route('/api/chat', methods=['POST', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Log headers for debugging
        logger.info(f"Request headers: {dict(request.headers)}")
        
        # Validate request content type
        if not request.is_json:
            logger.error("Invalid content type. Expected application/json")
            return jsonify({
                'error': 'Invalid content type. Expected application/json',
                'received_content_type': request.content_type
            }), 400

        # Log raw request data
        raw_data = request.get_data().decode('utf-8')
        logger.info(f"Raw request data: {raw_data}")

        data = request.get_json(force=False, silent=False)
        logger.info(f"Parsed request data: {data}")

        # Validate message
        message = data.get('message')
        if not message:
            logger.error("No message provided in request")
            return jsonify({'error': 'No message provided'}), 400

        # Validate API key
        if not GROQ_API_KEY:
            logger.error("GROQ_API_KEY is not set")
            return jsonify({'error': 'GROQ API key is not configured'}), 500

        logger.info(f"Processing message: {message}")

        # Call Groq API
        logger.info("Sending request to Groq API...")
        try:
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
            logger.info("Groq API response received successfully")
        except Exception as groq_error:
            logger.error(f"Groq API error: {str(groq_error)}")
            return jsonify({'error': f'Groq API error: {str(groq_error)}'}), 500
        
        response = chat_completion.choices[0].message.content
        
        # Log the response for debugging
        logger.info(f"Response content: {response}")
        
        # Ensure response is properly formatted JSON
        json_response = json.dumps({'response': response})
        logger.info(f"Formatted JSON response: {json_response}")
        
        return Response(
            json_response,
            status=200,
            mimetype='application/json'
        )

    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return jsonify({
            'error': 'Invalid JSON in request',
            'details': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({
            'error': str(e),
            'type': type(e).__name__
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print("Starting Flask server...")
    print(f"GROQ_API_KEY: {GROQ_API_KEY[:10]}..." if GROQ_API_KEY else "Not set")
    app.run(host='0.0.0.0', port=port) 