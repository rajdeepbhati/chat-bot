import { NextRequest } from 'next/server';

// API Configuration - stored securely on backend
// TODO: ADD API KEY BELOW
const API_KEY = 'c2bdddd4445d4161b71db547d0da7479.T3KgaPHo7e1iBTKG';
const BASE_URL = 'https://api.z.ai/api/paas/v4';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json() as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Prepend system message to the messages array
    const messagesWithSystem: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant.',
      },
      ...messages,
    ];

    // Create non-streaming response
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Language': 'en-US,en',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4.5-flash',
        messages: messagesWithSystem,
        temperature: 1.0,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      return new Response(JSON.stringify({ error: `API Error: ${response.status}` }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse the response
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Return regular JSON response
    return new Response(JSON.stringify({ content }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
