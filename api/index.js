import { handleRequest } from '../dist/server/app.js';

export default async function handler(req, res) {
  try {
    await handleRequest(req, res);
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }));
    }
  }
}
