import { createServer } from './app.ts';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = createServer();

server.listen(PORT, HOST, () => {
  console.log(`================================================================`);
  console.log(`🚀 ClaimCheck Operator Web Application is LIVE`);
  console.log(`   URL: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`   Prometheus Metrics: http://localhost:${PORT}/metrics`);
  console.log(`   AMD Inference Endpoint: ${process.env.CLAIMCHECK_AMD_ENDPOINT || 'Local Fallback (Active)'}`);
  console.log(`================================================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, closing ClaimCheck HTTP server gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, closing ClaimCheck HTTP server gracefully...');
  server.close(() => {
    process.exit(0);
  });
});
