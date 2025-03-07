import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Secure MongoDB Connection
const MONGO_URI = "mongodb+srv://Dharaneesh:dharaneesh86889944356127@dharaneeesh.gtvh6.mongodb.net/?retryWrites=true&w=majority&appName=dharaneeesh";
if (!MONGO_URI) {
    console.error("❌ Missing MONGO_URI in environment variables.");
    process.exit(1);
}

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// Room Schema & Model
const RoomSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    messages: [{
        username: { type: String, required: true },
        text: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
});
const Room = mongoose.model('Room', RoomSchema);

// API Routes

// Create Room
app.post('/api/rooms', async (req, res) => {
    try {
        let roomCode;
        let roomExists;
        do {
            roomCode = Math.random().toString(36).substr(2, 6).toUpperCase();
            roomExists = await Room.findOne({ code: roomCode });
        } while (roomExists);

        const newRoom = new Room({ code: roomCode, messages: [] });
        await newRoom.save();
        res.status(201).json({ roomCode });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Join Room
app.get('/api/rooms/:roomCode', async (req, res) => {
    try {
        const { roomCode } = req.params;
        const room = await Room.findOne({ code: roomCode });
        if (!room) return res.status(404).json({ error: 'Room not found' });

        res.json({ roomCode });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Send Message
app.post('/api/rooms/:roomCode/messages', async (req, res) => {
    try {
        const { roomCode } = req.params;
        const { username, message } = req.body;
        if (!username || !message.trim()) {
            return res.status(400).json({ error: "Invalid input" });
        }

        const room = await Room.findOne({ code: roomCode });
        if (!room) return res.status(404).json({ error: 'Room not found' });

        const newMessage = { username, text: message, timestamp: new Date() };
        room.messages.push(newMessage);
        await room.save();

        res.json({ success: true, message: newMessage });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get Messages
app.get('/api/rooms/:roomCode/messages', async (req, res) => {
    try {
        const { roomCode } = req.params;
        const room = await Room.findOne({ code: roomCode });
        if (!room) return res.status(404).json({ error: 'Room not found' });

        res.json({ messages: room.messages });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Delete Room
app.delete('/api/rooms/:roomCode', async (req, res) => {
    try {
        const { roomCode } = req.params;
        const deletedRoom = await Room.findOneAndDelete({ code: roomCode });
        if (!deletedRoom) return res.status(404).json({ error: 'Room not found' });

        res.json({ success: true, message: 'Room deleted' });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Health Check
app.get('/', (req, res) => {
    res.status(200).send("API is running");
});

// Start Server
const PORT = process.env.PORT || process.env.X_ZOHO_CATALYST_LISTEN_PORT || 2000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
