# 🎮 Mokepon - Multiplayer Online Arena Game

<div align="center">

![Mokepon](https://img.shields.io/badge/Game-Mokepon-brightgreen)
![Node.js](https://img.shields.io/badge/Backend-Node.js_Express-green)
![JavaScript](https://img.shields.io/badge/Frontend-Vanilla_JS-yellow)
![Real--time](https://img.shields.io/badge/Architecture-Real--time_Multiplayer-blue)

**A real-time multiplayer browser-based battle arena game where players navigate a digital arena, discover opponents, and engage in turn-based combat.**

[Features](#features) • [Tech Stack](#tech-stack) • [Getting Started](#getting-started) • [Gameplay](#gameplay) • [Architecture](#architecture)

</div>

---

## 🎯 Overview

Mokepon is a **full-stack multiplayer gaming application** that combines **real-time spatial awareness** with **turn-based combat mechanics**. Players join a shared server, navigate an interactive canvas-based arena using keyboard controls, and when they collide with opponents, they engage in a strategic battle system similar to Pokémon.

### Key Innovation
The game seamlessly integrates **client-side canvas rendering** for real-time movement with **server-side synchronization** to maintain accurate opponent positions across all connected players, creating an engaging multiplayer experience in the browser.

---

## ✨ Features

### 🎭 Gameplay Features
- **Character Selection**: Choose from 3 unique Mokepon characters, each with distinct attack types
  - **Hipodoge** (Water-focused)
  - **Capipepo** (Grass-focused)
  - **Ratigueya** (Fire-focused)
- **Real-time Movement**: Navigate the arena using arrow keys or on-screen directional buttons
- **Dynamic Collision Detection**: Automatic opponent detection when players collide
- **Turn-Based Combat System**: 5-round strategic battles using rock-paper-scissors-style attack mechanics (Fire > Grass > Water > Fire)
- **Live Score Tracking**: Track wins and losses across multiple battles
- **Responsive Canvas Rendering**: Smooth 50ms update rate for fluid gameplay on various screen sizes

### 🔧 Technical Features
- **Multiplayer Synchronization**: Real-time position updates across all connected clients
- **RESTful API Architecture**: Clean separation between game state management and client logic
- **Responsive Design**: Works on desktop (mouse/keyboard) and mobile (touch controls)
- **Scalable Player Management**: Handles concurrent players with unique session IDs
- **CORS-Enabled**: Cross-origin support for flexible deployment

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Architecture**: RESTful API with real-time position streaming
- **Game State Management**: In-memory player/Mokepon storage with server-side collision-free positioning

### Frontend
- **Language**: Vanilla JavaScript (no frameworks)
- **Rendering**: HTML5 Canvas 2D Context
- **Styling**: CSS3 with custom animations
- **UI**: Semantic HTML with responsive layout
- **Network**: Fetch API for client-server communication
- **Input Handling**: Keyboard events + Touch event support

### Assets & Resources
- **Fonts**: Google Fonts (Fredoka One, Poppins)
- **Images**: Sprite-based character and map assets
- **Static Files**: Express.js static middleware

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v12 or higher)
- **npm** (comes with Node.js)
- A modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mokepon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```
   The server will run on `http://localhost:8080`

4. **Open in browser**
   - Navigate to `http://localhost:8080` (or your server IP)
   - Each new tab/window creates a new player instance
   - Invite multiple users to join the game

### Configuration

**Server IP Address**: Currently hardcoded to `192.168.20.47:8080`
- Update all `fetch()` calls in [public/mokepon.js](public/mokepon.js) to match your deployment server IP
- Recommended: Use environment variables for production deployment

---

## 🎮 Gameplay Guide

### Phase 1: Character Selection
1. Choose your Mokepon from the available options
2. Click "Seleccionar" (Select) to confirm

### Phase 2: Arena Navigation
- Use **Arrow Keys** (↑ ↓ ← →) to move your character
- Alternative: Use on-screen directional buttons
- Each character occupies a 40x40 pixel sprite
- Arena dimensions are responsive based on screen size (max 350px width)

### Phase 3: Battle Encounter
When your character touches an opponent:
1. Arena view freezes
2. Battle interface appears
3. Choose 5 sequential attacks before opponent does
4. Available attacks: 🔥 Fire, 💧 Water, 🌱 Grass

### Battle Mechanics
- **Type Advantage**: Fire beats Grass, Water beats Fire, Grass beats Water
- **Ties**: Identical attacks result in draws
- **5-Round Match**: Highest wins out of 5 rounds wins the battle
- **Multiple Matches**: Return to arena to find new opponents

---

## 🏗️ Architecture

### System Design Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │  UI Components   │         │   Canvas Game Engine    │  │
│  │  - Selection     │         │   - Real-time Rendering │  │
│  │  - Battle Info   │         │   - Collision Detection │  │
│  │  - Score Board   │         │   - Position Management │  │
│  └────────┬─────────┘         └──────────┬───────────────┘  │
│           │                             │                  │
│           └─────────────┬───────────────┘                  │
│                         │ Fetch API                        │
└────────────────────────┼────────────────────────────────────┘
                         │
                    HTTP REST
                         │
┌────────────────────────┼────────────────────────────────────┐
│                    SERVER (Node.js)                         │
├────────────────────────┼────────────────────────────────────┤
│   ┌──────────────────────────────────────────────────────┐ │
│   │  Express.js REST API Endpoints                       │ │
│   │  ┌──────────────────────────────────────────────────┐│ │
│   │  │ GET  /unirse → Player registration               ││ │
│   │  │ POST /mokepon/:id → Select character            ││ │
│   │  │ POST /mokepon/:id/posicion → Update position    ││ │
│   │  │ POST /mokepon/:id/ataques → Submit attacks      ││ │
│   │  │ GET  /mokepon/:id/ataques → Retrieve attacks    ││ │
│   │  └──────────────────────────────────────────────────┘│ │
│   │                                                       │ │
│   │  ┌──────────────────────────────────────────────────┐│ │
│   │  │  In-Memory Game State                            ││ │
│   │  │  ├─ jugadores[] array (player sessions)          ││ │
│   │  │  ├─ Jugador class (player data)                  ││ │
│   │  │  └─ Mokepon class (character data)               ││ │
│   │  └──────────────────────────────────────────────────┘│ │
│   └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### API Endpoints

#### Player Management
- **GET** `/unirse` - Register new player
  - Returns: Unique player ID (UUID-like string)

#### Character Selection
- **POST** `/mokepon/:jugadorId` - Assign character to player
  - Body: `{ mokepon: "Hipodoge|Capipepo|Ratigueya" }`

#### Real-time Position Sync
- **POST** `/mokepon/:jugadorId/posicion` - Update player position
  - Body: `{ x: number, y: number }`
  - Response: `{ enemigos: [{ id, mokepon, x, y, ... }] }`

#### Combat System
- **POST** `/mokepon/:jugadorId/ataques` - Submit attack sequence
  - Body: `{ ataques: ["FUEGO 🔥", "AGUA 💧", ...] }`
- **GET** `/mokepon/:jugadorId/ataques` - Retrieve attack sequence
  - Response: `{ ataques: [...] }`

### Class Hierarchy

**Server-side:**
```javascript
class Jugador {
  id: string                    // Unique player identifier
  mokepon: Mokepon            // Selected character
  x: number, y: number        // Current position
  ataques: string[]           // Queued attacks
}

class Mokepon {
  nombre: string              // Character name
}
```

**Client-side:**
```javascript
class Mokepon {
  nombre: string              // Character name
  foto: string               // Card display image
  vida: number               // Max health (unused in current version)
  fotoMapa: Image            // Canvas sprite
  x: number, y: number       // Position
  velocidadX/Y: number       // Velocity (for smooth movement)
  ataques: Attack[]          // Available attacks
}

class Attack {
  nombre: string             // Visual representation (emoji)
  id: string                 // Button identifier
}
```

### Data Flow
1. **Join**: Player browser → `/unirse` → Receives unique ID
2. **Select Character**: Selection form → `/mokepon/:id` (POST)
3. **Move**: Canvas game loop → `/mokepon/:id/posicion` (POST) every 50ms
4. **Detect Collision**: Client-side AABB collision check
5. **Battle**: 
   - Player selects 5 attacks → `/mokepon/:id/ataques` (POST)
   - Client polls `/mokepon/:enemyId/ataques` every 50ms
   - When both have 5 attacks → Combat engine resolves winner

---

## 📊 Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Canvas Update Rate | 50ms (20 FPS) | Sufficient for turn-based action |
| Position Sync Frequency | 50ms | Every canvas repaint |
| Attack Poll Interval | 50ms | Client-side polling until opponent ready |
| Max Players | Limited by server memory | No built-in limit currently implemented |
| Arena Size | Responsive | Max 350px width, maintains 600:800 aspect ratio |
| Character Sprite Size | 40x40px | Consistent across all characters |

---

## 🔒 Security Considerations

### Current Limitations
- ⚠️ **No Authentication**: Any client can impersonate any player ID
- ⚠️ **No Input Validation**: Attack sequences not verified server-side
- ⚠️ **No Rate Limiting**: Susceptible to request flooding
- ⚠️ **Client-side Combat**: Winner determined by local JavaScript (cheatable)

### Recommendations for Production
```javascript
// TODO: Implement
- JWT-based authentication
- Input validation & sanitization
- Rate limiting middleware (express-ratelimit)
- Server-side combat logic validation
- WebSocket instead of HTTP polling
- Data persistence (MongoDB/PostgreSQL)
- Player rankings & statistics
```

---

## 🎨 Project Structure

```
mokepon/
├── index.js                    # Express server & game logic
├── public/
│   ├── index.html             # Main game UI
│   ├── mokepon.js             # Client-side game engine
│   ├── styles.css             # Game styling
│   └── assets/
│       ├── background.jpg     # Arena background
│       ├── hipodoge.png       # Hipodoge sprite
│       ├── capipepo.png       # Capipepo sprite
│       ├── ratigueya.png      # Ratigueya sprite
│       └── mokepons_mokepon_*.png  # Attack animations
├── package.json               # Dependencies
└── README.md                  # This file
```

---

## 🎯 Code Quality Highlights

### Strengths
✅ **Modular Function Design** - Clear separation of concerns (selection, movement, combat)
✅ **Object-Oriented Approach** - Character data encapsulated in classes
✅ **Responsive Rendering** - Dynamic canvas sizing based on viewport
✅ **Touch & Desktop Support** - Dual input method support
✅ **Clean REST Architecture** - Standard HTTP methods and status codes
✅ **Scalable Position System** - Server-side enemy data mapping to client objects

### Areas for Improvement
- **Minification**: Unminified production assets
- **Error Handling**: Limited try-catch blocks, no error recovery
- **Magic Numbers**: Hardcoded speeds (5px), dimensions (40x40), IPs
- **State Management**: No Redux/equivalent for complex client state
- **Testing**: No unit or integration tests
- **Documentation**: Limited inline comments

---

## 🚀 Deployment

### Local Development
```bash
# Terminal 1: Start server
node index.js

# Terminal 2: Open game (multiple browsers/tabs)
# Open http://localhost:8080
```

### Production Deployment

**Option 1: Heroku**
```bash
heroku create mokepon-game
git push heroku main
heroku open
```

**Option 2: AWS EC2**
```bash
# Install Node.js on instance
# Clone repo, install deps
npm install
# Use PM2 for process management
npm install -g pm2
pm2 start index.js
pm2 save
```

**Option 3: Docker**
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8080
CMD ["node", "index.js"]
```

### Environment Variables
Create `.env` file:
```
SERVER_PORT=8080
SERVER_HOST=localhost
NODE_ENV=production
CORS_ORIGIN=*
```

---

## 🤝 Contributing

Pull requests are welcome! For major changes:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Future Enhancements

### Short Term
- [ ] Add player names/nicknames
- [ ] Implement persistent leaderboards
- [ ] Add sound effects & background music
- [ ] Support 4-player battles
- [ ] Add more Mokepon characters
- [ ] Implement ability power-ups

### Medium Term
- [ ] Migrate to WebSocket for true real-time sync
- [ ] Add game lobby system
- [ ] Implement matchmaking queue
- [ ] Add replay system
- [ ] Create mobile-specific UI optimizations
- [ ] Add spectator mode

### Long Term
- [ ] Database integration (player profiles, stats)
- [ ] Ranked competitive ladder
- [ ] Tournament mode
- [ ] Trading system
- [ ] Game server federation (multiple servers)
- [ ] Mobile app (React Native)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👨‍💻 Author

**David**

[GitHub](https://github.com/yourusername) | [LinkedIn](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgments

- Inspired by Pokémon game mechanics
- Built with vanilla JavaScript (no frameworks required!)
- Special thanks to the Node.js and Express.js communities

---

## 📞 Support

Found a bug? Have a question? Open an issue on GitHub!

**Game Status**: ✅ Fully Playable | ⚠️ Development | 🚀 Ready for Demo

---

<div align="center">

**Made with ❤️ by David**

*"Every line of code is a step towards epic multiplayer gaming!"*

</div>
