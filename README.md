# 🎵 iPlay - Social Music Streaming Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Socket.io-4.7.5-black?style=for-the-badge&logo=socket.io" alt="Socket.io">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/Vite-5.0+-purple?style=for-the-badge&logo=vite" alt="Vite">
</div>

<div align="center">
  <h3>🎧 Stream Music Together • 💬 Real-time Chat • ❤️ Social Features</h3>
  <p>A modern, collaborative music streaming platform built with React and Node.js</p>
</div>

---

## 🌟 Features

### 🎵 **Music Streaming**
- **iTunes Integration**: Access millions of songs through iTunes Search API
- **High-Quality Previews**: Stream 30-second previews of tracks
- **Smart Search**: Find songs by artist, title, album, or genre
- **Album Browsing**: Explore full album tracklists

### 👥 **Social Listening**
- **Listen Together Sessions**: Create or join shared listening rooms
- **Real-time Synchronization**: Perfectly synced playback across all participants
- **Session Management**: Host controls with seamless handoff
- **Live Chat**: Built-in messaging during listening sessions

### 💝 **Personal Library**
- **Favorites System**: Save and organize your favorite tracks
- **User Authentication**: Secure JWT-based login system
- **Persistent Storage**: Your favorites saved across sessions
- **Personal Playlists**: Create and manage custom playlists

### 🎨 **Modern UI/UX**
- **Spotify-Inspired Design**: Clean, dark theme interface
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Fluid transitions and hover effects
- **Intuitive Navigation**: Easy-to-use sidebar and player controls

## 🛠️ Tech Stack

### **Frontend**
- **React 18.2** - Modern UI library with hooks
- **Vite** - Lightning-fast build tool and dev server
- **Socket.io Client** - Real-time bidirectional communication
- **CSS3** - Custom styling with CSS variables and grid/flexbox

### **Backend**
- **Node.js & Express** - Server runtime and web framework
- **Socket.io** - WebSocket implementation for real-time features
- **MongoDB Atlas** - Cloud database for user data and favorites
- **JWT Authentication** - Secure token-based authentication
- **bcryptjs** - Password hashing and security

### **External APIs**
- **iTunes Search API** - Music catalog and streaming
- **RESTful Architecture** - Clean API design patterns

## 🚀 Quick Start

### Prerequisites
```bash
node -v  # v18.0.0 or higher
npm -v   # v8.0.0 or higher
```

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/iplay-music-app.git
cd iplay-music-app
```

### 2. Backend Setup
```bash
cd music/backend
npm install
```

Create `.env` file:
```env
PORT=3002
JWT_SECRET=your-super-secret-jwt-key-here
MONGO_URI=your-mongodb-connection-string
NODE_ENV=development
```

Start backend server:
```bash
npm start
# Server running on http://localhost:3002
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
# Frontend running on http://localhost:5173
```

### 4. Access the Application
Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3002

## 📁 Project Structure

```
iplay-music-app/
├── music/
│   ├── frontend/                 # React frontend application
│   │   ├── src/
│   │   │   ├── App.jsx          # Main application component
│   │   │   ├── main.jsx         # Application entry point
│   │   │   └── index.css        # Global styles
│   │   ├── package.json         # Frontend dependencies
│   │   └── vite.config.js       # Vite configuration
│   │
│   └── backend/                 # Node.js backend server
│       ├── server.js            # Express server and Socket.io setup
│       └── package.json         # Backend dependencies
│
├── Jenkinsfile                  # CI/CD pipeline configuration
├── docker-compose.yml           # Docker orchestration
└── README.md                    # This file
```

## 🎯 Key Features Breakdown

### 🔐 Authentication System
- **Sign Up/Sign In**: Secure user registration and login
- **JWT Tokens**: Stateless authentication with 1-hour expiry
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: Automatic token refresh and logout

### 🎵 Music Player
- **Playback Controls**: Play, pause, seek functionality
- **Progress Tracking**: Real-time playback position
- **Album Integration**: Browse and play full album tracklists
- **Quality Streaming**: 128kbps AAC preview format

### 👥 Social Features
- **Room Creation**: Generate unique 6-character session IDs
- **Real-time Sync**: Sub-second accuracy across all participants
- **Chat System**: Live messaging with user identification
- **User Management**: Join/leave notifications and user lists

### 📱 Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Touch-Friendly**: Large tap targets and swipe gestures
- **Performance**: Optimized rendering and lazy loading
- **Accessibility**: ARIA labels and keyboard navigation

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d

# Stop services
docker-compose down
```

### Individual Docker Builds
```bash
# Backend
cd music/backend
docker build -t iplay-backend .

# Frontend
cd music/frontend
docker build -t iplay-frontend .
```

## 🔧 CI/CD Pipeline

The project includes a Jenkins pipeline configuration that:

- **🔍 Runs Tests**: Linting and unit tests
- **🏗️ Builds**: Frontend and backend builds
- **📦 Creates WAR Files**: For Tomcat deployment
- **🚀 Deploys**: Automated deployment to Tomcat server
- **✅ Health Checks**: Post-deployment verification

### Pipeline Stages:
1. **Checkout** - Pull latest code
2. **Install Dependencies** - npm install for both frontend/backend
3. **Test** - Run linting and tests
4. **Build** - Create production builds
5. **Package** - Generate WAR files
6. **Deploy** - Deploy to Tomcat server
7. **Health Check** - Verify deployment success

## 🌐 API Endpoints

### Authentication
```http
POST /api/auth/signup     # Create new user account
POST /api/auth/signin     # User login
```

### Favorites (Protected)
```http
GET    /api/favorites           # Get user's favorite tracks
POST   /api/favorites           # Add track to favorites
DELETE /api/favorites/:trackId  # Remove track from favorites
```

### Health Check
```http
GET /api/health                 # Server health status
```

### WebSocket Events
```javascript
// Client to Server
'join_session'      // Join a listening session
'playback_control'  // Control playback (play/pause/seek)
'chat_message'      // Send chat message
'leave_session'     // Leave current session

// Server to Client
'user_joined'       // User joined session notification
'update_playbook'   // Sync playback state
'new_message'       // New chat message received
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and patterns
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 🐛 Known Issues & Roadmap

### Current Limitations
- 30-second preview limit (iTunes API restriction)
- No offline playback capability
- Limited to iTunes catalog only

### Upcoming Features
- 🎨 Custom playlist creation
- 🔄 Spotify/Apple Music integration
- 📊 Listening statistics and analytics
- 🎵 Enhanced audio controls (equalizer, effects)

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/iplay-music-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/iplay-music-app/discussions)
- **Email**: eswarlazypanda@gmail.com

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **iTunes API** - For providing the music catalog
- **Socket.io** - For real-time communication capabilities
- **MongoDB Atlas** - For reliable cloud database hosting
- **Vite** - For blazing-fast development experience
- **React Community** - For excellent documentation and ecosystem

---

<div align="center">
  <p><strong>Made with ❤️ by Eshwar Krishna Kancharlapalli</strong></p>
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
