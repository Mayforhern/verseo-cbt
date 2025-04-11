import { NextResponse } from 'next/server'
import { Configuration, OpenAIApi } from 'openai-edge'

// Create an OpenAI API client (that's edge friendly!)
const config = new Configuration({
  apiKey: process.env.GROQ_API_KEY,
  basePath: 'https://api.groq.com/openai/v1'
});

const openai = new OpenAIApi(config);

export async function POST(req: Request) {
  try {
    // Check if API key is set
    if (!process.env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set in environment variables')
      return NextResponse.json(
        { error: 'Groq API key is not configured. Please set GROQ_API_KEY in your environment variables.' },
        { status: 500 }
      )
    }

    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request format. Messages array is required.' },
        { status: 400 }
      )
    }

    console.log('Making request to Groq API with key:', process.env.GROQ_API_KEY.substring(0, 5) + '...')

    const response = await openai.createChatCompletion({
      model: 'llama2-70b-4096',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. You provide clear, concise, and accurate responses. When providing code examples, you include proper syntax highlighting and explanations.'
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    const data = await response.json();
    return NextResponse.json({ content: data.choices[0].message.content });
  } catch (error) {
    console.error('Error in chat route:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
} 