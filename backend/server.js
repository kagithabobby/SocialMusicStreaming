const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require("socket.io");

// --- Hardcoded Configuration ---
const GITHUB_PAGES_URL = "https://parassoni0.github.io/music";
const CUSTOM_DOMAIN_HTTP = "http://eshwarkrishna.me";
const CUSTOM_DOMAIN_HTTPS = "https://eshwarkrishna.me";
const MONGO_URI = "mongodb+srv://test:703vr9FJwzKmfc4h@hack.8syianl.mongodb.net/hack";
const JWT_SECRET = "your-super-secret-key-that-is-very-long-and-random";

const app = express();
const server = http.createServer(app);

// --- CORS Configuration ---
// **MODIFIED**: Added your new custom domain to the list of allowed origins.
const allowedOrigins = [GITHUB_PAGES_URL, CUSTOM_DOMAIN_HTTP, CUSTOM_DOMAIN_HTTPS, 'http://localhost:5173'];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions
});

const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.options('*', cors(corsOptions)); 
app.use(cors(corsOptions));
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB."))
  .catch(err => console.error("MongoDB connection error:", err));

// ... (The rest of your server.js file remains exactly the same) ...
// --- Mongoose Schemas ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }
});

const favoriteSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trackId: { type: String, required: true },
    trackData: { type: Object, required: true }
});
favoriteSchema.index({ userId: 1, trackId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const Favorite = mongoose.model('Favorite', favoriteSchema);

// --- API Health Check Route ---
app.get("/", (req, res) => {
    res.status(200).send("Music App Backend is running!");
});

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required.' });
        }
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User created successfully.' });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ message: 'Error signing up user.' });
    }
});

app.post('/api/auth/signin', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found.' });
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials.' });
        const token = jwt.sign({ username: user.username, id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ result: { id: user._id, username: user.username }, token });
    } catch (error) {
        console.error("Signin Error:", error);
        res.status(500).json({ message: 'Something went wrong.' });
    }
});

// --- Middleware to verify token ---
const auth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Authentication failed: No token provided." });
        const decodedData = jwt.verify(token, JWT_SECRET);
        req.userId = decodedData?.id;
        next();
    } catch (error) {
        res.status(401).json({ message: "Authentication failed: Invalid token." });
    }
};

// --- Favorites Routes (Protected) ---
app.get('/api/favorites', auth, async (req, res) => {
 try {
   const favorites = await Favorite.find({ userId: req.userId });
   res.json(favorites.map(fav => fav.trackData));
 } catch (error) {
   console.error("Get Favorites Error:", error);
   res.status(500).json({ message: 'Error fetching favorites' });
 }
});

app.post('/api/favorites', auth, async (req, res) => {
 const { track } = req.body;
 try {
   const newFavorite = new Favorite({ userId: req.userId, trackId: track.trackId, trackData: track });
   await newFavorite.save();
   res.status(201).json(newFavorite.trackData);
 } catch (error) {
   if (error.code === 11000) return res.status(409).json({ message: 'Track is already in favorites.' });
   console.error("Post Favorite Error:", error);
   res.status(500).json({ message: 'Error adding favorite' });
 }
});

app.delete('/api/favorites/:trackId', auth, async (req, res) => {
 try {
   const { trackId } = req.params;
   await Favorite.deleteOne({ userId: req.userId, trackId });
   res.status(200).json({ message: 'Favorite removed successfully.' });
 } catch (error) {
   console.error("Delete Favorite Error:", error);
   res.status(500).json({ message: 'Error removing favorite' });
 }
});

// --- Socket.io Real-time Logic ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_session', (sessionId) => {
    socket.join(sessionId);
    console.log(`User ${socket.id} joined session: ${sessionId}`);
    socket.to(sessionId).emit('user_joined', { user: 'A new user', text: 'has joined the session.'});
  });

  socket.on('playback_control', (data) => {
    socket.to(data.sessionId).emit('update_playback', data);
  });

  socket.on('chat_message', (data) => {
    io.to(data.sessionId).emit('new_message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- Start Server ---
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

