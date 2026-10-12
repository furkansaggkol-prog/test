const express = require('express');
const http = require('http');
const { ExpressPeerServer } = require('peer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 9000;

// Statik dosyaları sun (public/ klasörü)
app.use(express.static(path.join(__dirname, 'public')));

// HTTP sunucusu (WebSocket upgrade için gerekli)
const server = http.createServer(app);

// PeerJS sinyal sunucusu
// path: '/' → WebSocket yolu: /peerjs (PeerJS otomatik ekler)
// Client'ta da path: '/' → WebSocket yolu: /peerjs → EŞLEŞME ✓
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/',
  allow_discovery: true,
  alive_timeout: 60000,
  expire_timeout: 30000,
  concurrent_limit: 50,
  key: 'peerjs'
});

app.use(peerServer);

// Bağlı peer'ları gösteren debug endpoint
app.get('/api/peers', function(req, res) {
  try {
    // PeerJS v1.x realm API
    var realm = peerServer._realm;
    var clients = [];
    if (realm && realm.getClientsIds) {
      clients = Array.from(realm.getClientsIds());
    }
    res.json({
      connected_peers: clients,
      count: clients.length,
      server_time: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime())
    });
  } catch(e) {
    res.json({ error: e.message, connected_peers: [], count: 0 });
  }
});

// Health check
app.get('/api/health', function(req, res) {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Peer logları
peerServer.on('connection', function(client) {
  console.log('[' + new Date().toISOString() + '] ✅ Peer bağlandı: ' + client.getId());
});

peerServer.on('disconnect', function(client) {
  console.log('[' + new Date().toISOString() + '] ❌ Peer ayrıldı: ' + client.getId());
});

// Sunucuyu başlat
server.listen(PORT, function() {
  console.log('🍓 Çilek sunucusu çalışıyor: http://localhost:' + PORT);
  console.log('📡 PeerJS WebSocket yolu: /peerjs');
  console.log('🔍 Debug: http://localhost:' + PORT + '/api/peers');
});
