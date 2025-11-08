# 🎯 Gearted - Airsoft Marketplace React Native App

<div align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.74-blue?style=for-the-badge&logo=react" alt="React Native"/>
  <img src="https://img.shields.io/badge/Expo-SDK%2051-black?style=for-the-badge&logo=expo" alt="Expo"/>
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey?style=for-the-badge" alt="Platform"/>
</div>

## 📱 About

**Gearted** is a specialized marketplace for airsoft gear, replicas, and equipment. Buy, sell, and trade airsoft items with secure payments (escrow), verified profiles, and technical compatibility verification.

### 🎨 Design Philosophy
- **Military Aesthetic**: Professional, tactical-inspired design
- **User-Friendly**: Intuitive interface for airsoft enthusiasts
- **Secure Trading**: Built-in escrow system and verified profiles
- **Compatibility Focus**: Technical verification for parts compatibility

## ✨ Features

### 🏠 **Landing Page**
- Hero section with gradient backgrounds
- Interactive category browsing
- Feature showcase with bullet points
- Theme switching (Ranger, Desert, Night Ops)

### 🔧 **Compatibility System**
- Quick compatibility checker widget
- Dropdown selection for weapon types and brands
- Full compatibility results drawer
- Color-coded compatibility percentages

### 🎨 **Theme System**
- **Ranger Theme**: Earth tones and natural greens
- **Desert Theme**: Warm sandy colors
- **Night Ops Theme**: Dark tactical aesthetics
- Dynamic theme switching across all components

### 🧩 **Component Library**
- `BrandLogo`: Official grenade-style logo with gradient
- `CategoryPill`: Interactive category selection pills
- `FeatureCard`: Feature showcase cards with checkmarks
- `CompatibilityTeaser`: Quick compatibility checking widget
- `CompatDrawer`: Full-screen compatibility results modal

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (optional)
- Expo Go app on your device

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/maous26/gearted.git
   cd gearted
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Create your environment file**
  ```bash
  cp .env.example .env
  # Adjust EXPO_PUBLIC_API_URL to point to your backend (e.g. http://localhost:3000)
  ```

5. **Run the backend (Express + Prisma)**
  ```bash
  cd backend
  npm install
  npx prisma migrate dev
  npm run seed # if a seed script is provided
  npm start
  ```

6. **Run on device/simulator**
   - Scan QR code with Expo Go (mobile)
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser

## 📁 Project Structure

```
gearted/
├── 📱 app/
│   ├── _layout.tsx          # Root layout with theme context
│   ├── index.tsx            # Main landing page
│   └── +not-found.tsx       # 404 page
├── 🧩 components/
│   ├── BrandLogo.tsx        # Official Gearted logo
│   ├── CategoryPill.tsx     # Category selection pills
│   ├── CompatDrawer.tsx     # Compatibility results modal
│   ├── CompatibilityTeaser.tsx # Quick compatibility checker
│   ├── FeatureCard.tsx      # Feature showcase cards
│   ├── GeartedStandaloneLogo.tsx # Standalone branding
│   └── Hero.tsx             # Hero section component
├── 🎨 themes.ts             # Theme system definitions
├── 📊 data.ts               # Static data (categories, features)
├── ⚙️ metro.config.js       # Metro bundler configuration
└── 📋 package.json          # Dependencies and scripts
```

## 🎨 Themes

### 🌿 Ranger Theme
- **Primary**: Forest greens and earth tones
- **Background**: Light cream and beige
- **Accent**: Military green gradients

### 🏜️ Desert Theme  
- **Primary**: Sandy browns and warm tones
- **Background**: Light desert colors
- **Accent**: Desert brown gradients

### 🌙 Night Ops Theme
- **Primary**: Dark tactical colors
- **Background**: Deep blacks and grays
- **Accent**: Dark green gradients

## 🛠️ Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Styling**: React Native StyleSheet
- **Gradients**: expo-linear-gradient
- **Safe Areas**: react-native-safe-area-context
- **Development**: Expo CLI with tunnel mode

## 🔧 Available Scripts

```bash
# Start development server
npm start
# or
npx expo start

# Start with tunnel (for device testing)
npx expo start --tunnel

# Start for iOS
npx expo start --ios

# Start for Android  
npx expo start --android

# Start for web
npx expo start --web

# Type checking
npx tsc --noEmit

# Generate & run Prisma migrations (backend)
npx prisma migrate dev

# Apply existing migrations & generate client
npx prisma generate

# Run backend (from backend/ folder)
npm start
```

## 🔐 Environment Variables

Environment variables are kept in a local `.env` file (not committed). Public variables prefixed with `EXPO_PUBLIC_` are embedded in the client bundle (treat them as non-secret). For anything sensitive (API keys, tokens), never use the `EXPO_PUBLIC_` prefix and never commit them.

| Variable | Example | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | `http://192.168.1.22:3000` | Base URL for the backend API (must be reachable from device) |
| `EXPO_PUBLIC_ENV` | `development` | Environment label for client logic & logging |

Add more backend-only secrets inside `backend/.env` (ensure it's ignored) e.g. database URLs, JWT secrets, etc.

### Adding New Env Vars
1. Add to `.env` (and `.env.example` with a placeholder)
2. If needed in the mobile client, prefix with `EXPO_PUBLIC_`
3. Restart Expo server for changes to propagate

### Rotating Exposed Values
If you accidentally commit any sensitive key:
1. Remove it from Git history (optional advanced step)
2. Rotate/regenerate the key at the provider
3. Re-deploy / restart the services

## 📱 Components Overview

### BrandLogo
Official Gearted logo with grenade-style design and shopping cart elements.
```typescript
<BrandLogo theme="ranger" size="medium" showText={true} />
```

### CategoryPill
Interactive category selection with icons and theme support.
```typescript
<CategoryPill 
  label="Assault Rifles" 
  icon="🔫" 
  theme="ranger"
  onPress={() => {}} 
/>
```

### CompatibilityTeaser
Quick compatibility checking widget with dropdowns.
```typescript
<CompatibilityTeaser 
  theme="ranger"
  onOpenDrawer={() => setDrawerOpen(true)}
/>
```

## 🎯 Roadmap

- [ ] **User Authentication**: Login/register system
- [ ] **Product Listings**: Browse and search functionality  
- [ ] **Escrow System**: Secure payment integration
- [ ] **User Profiles**: Verification and ratings
- [ ] **Messaging**: In-app communication
- [ ] **Push Notifications**: Real-time updates
- [ ] **Advanced Filters**: Enhanced search capabilities
- [ ] **Favorites**: Save items and searches

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Moussa** - [@maous26](https://github.com/maous26)

---

<div align="center">
  <p>🎯 Built with ❤️ for the airsoft community</p>
  <p>⚡ Powered by React Native & Expo</p>
</div>