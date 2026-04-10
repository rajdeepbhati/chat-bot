import { NextRequest } from 'next/server';

const API_KEY = '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';
const INVOKE_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, stream = false } = await request.json() as { messages: ChatMessage[]; stream?: boolean };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const messagesWithSystem: ChatMessage[] = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant.',
      },
      ...messages,
    ];

    const response = await fetch(INVOKE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': stream ? 'text/event-stream' : 'application/json',
      },
      body: JSON.stringify({
        model: 'moonshotai/kimi-k2.5',
        messages: messagesWithSystem,
        max_tokens: 16384,
        temperature: 1.0,
        top_p: 1.0,
        stream: stream,
        chat_template_kwargs: { thinking: true },
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

    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

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
