import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app } from './app.js';
import { initDatabase } from './database/db.js';
import { seedMenuData } from './database/seed.js';
import { getPrimaryLocalIp, getLocalIpAddresses } from './services/network.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = Number(process.env.PORT) || 3001;
const HOST = '0.0.0.0'; // Essential: binds to all network interfaces for local Wi-Fi access

// Initialize DB and ensure seed data is loaded
initDatabase();
seedMenuData(false);

const server = app.listen(PORT, HOST, () => {
  const primaryIp = getPrimaryLocalIp(process.env.LOCAL_IP);
  const localUrl = `http://localhost:${PORT}/`;
  const networkUrl = `http://${primaryIp}:${PORT}/`;
  const allInterfaces = getLocalIpAddresses();

  console.log('\n=============================================================');
  console.log('🍽️   SREE MK FOOD COURT — OFFLINE RESTAURANT MENU SERVER');
  console.log('=============================================================');
  console.log(`⚡  Local URL (this laptop):       ${localUrl}`);
  console.log(`📱  Mobile URL (local Wi-Fi QR):    ${networkUrl}`);
  console.log(`🔐  Admin Dashboard:                ${networkUrl}admin`);
  console.log('-------------------------------------------------------------');
  console.log('Available Local IPv4 Network Interfaces:');
  for (const iface of allInterfaces) {
    console.log(`   - [${iface.name}] http://${iface.address}:${PORT}/`);
  }
  console.log('-------------------------------------------------------------');
  console.log('💡  OFFLINE WI-FI SETUP INSTRUCTIONS:');
  console.log('   1. Connect restaurant laptop and phones to the same Wi-Fi router.');
  console.log('   2. No active internet connection is needed.');
  console.log(`   3. Scan or open: ${networkUrl}`);
  console.log('=============================================================\n');
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\nStopping Sree MK Food Court server...');
  server.close(() => {
    console.log('Server stopped cleanly.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
