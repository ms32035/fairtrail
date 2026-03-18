#!/usr/bin/env node
/**
 * Lightweight mock LLM server for Docker smoke tests.
 * Speaks the Anthropic Messages API format (/v1/messages).
 * Returns a canned flight price extraction response.
 */

import { createServer } from 'node:http';

const PORT = parseInt(process.env.LLMOCK_PORT || '19876', 10);

const CANNED_PRICES = JSON.stringify([
  {
    travelDate: '2026-06-15',
    price: 98,
    currency: 'USD',
    airline: 'Spirit',
    bookingUrl: 'https://www.google.com/travel/flights?q=flights+from+JFK+to+LAX',
    stops: 1,
    duration: '9h 45m',
    departureTime: '7:00 PM',
    seatsLeft: 2,
  },
  {
    travelDate: '2026-06-15',
    price: 172,
    currency: 'USD',
    airline: 'United',
    bookingUrl: 'https://www.google.com/travel/flights?q=flights+from+JFK+to+LAX',
    stops: 1,
    duration: '8h 30m',
    departureTime: '10:00 AM',
    seatsLeft: 3,
  },
  {
    travelDate: '2026-06-15',
    price: 189,
    currency: 'USD',
    airline: 'Delta',
    bookingUrl: 'https://www.google.com/travel/flights?q=flights+from+JFK+to+LAX',
    stops: 0,
    duration: '6h 15m',
    departureTime: '6:00 AM',
    seatsLeft: null,
  },
]);

const server = createServer((req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // Anthropic Messages API
  if (req.method === 'POST' && req.url === '/v1/messages') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      console.log(`[llmock] POST /v1/messages (${body.length} bytes)`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        id: 'msg_smoke_test',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'text', text: CANNED_PRICES }],
        model: 'mock-model',
        stop_reason: 'end_turn',
        usage: { input_tokens: 500, output_tokens: 200 },
      }));
    });
    return;
  }

  // Catch-all: return empty response for any other endpoint
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ choices: [{ message: { content: '[]' } }], usage: { prompt_tokens: 0, completion_tokens: 0 } }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[llmock] Mock LLM server listening on port ${PORT}`);
});
