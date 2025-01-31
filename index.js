const express = require("express");
const WebSocket = require("ws");
const http = require("http");

// Buat instance Express dan HTTP server
const app = express();
const server = http.createServer(app);

// Buat WebSocket server dengan menggabungkan ke HTTP server
const wss = new WebSocket.Server({ server });

// Buat Map untuk menyimpan koneksi WebSocket berdasarkan ID
const clients = new Map();

// WebSocket Server Logic
wss.on("connection", function connection(ws) {
  console.log("Client connected");

  // Terima ID dari client saat pertama kali terhubung
  ws.on("message", function incoming(message) {
    const data = JSON.parse(message);

    if (data.type === "register" && data.id) {
      const clientId = data.id;
      clients.set(clientId, ws); // Simpan koneksi WebSocket dengan ID
      console.log(`Client registered with ID: ${clientId}`);
      clients.get(clientId).send(JSON.stringify({ data }));
    }
  });

  ws.on("close", () => {
    // Hapus client dari Map saat koneksi ditutup
    for (const [id, client] of clients.entries()) {
      if (client === ws) {
        clients.delete(id);
        console.log(`Client with ID ${id} disconnected`);
        break;
      }
    }
  });
});

// HTTP Server Logic
app.use(express.json());

app.post("/update-message", (req, res) => {
  const { id, data } = req.body;

  if (!id || !data) {
    return res.status(400).send("ID and message are required");
  }

  const client = clients.get(id); // Ambil koneksi WebSocket berdasarkan ID

  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({ data }));
    res.status(200).send(`Message sent to client with ID: ${id}`);
  } else {
    res.status(404).send(`Client with ID ${id} not found or not connected`);
  }
});

// Jalankan server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
