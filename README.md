# Stage Timer App v2.0.1

<img width="1212" height="907" alt="image" src="https://github.com/user-attachments/assets/b1db343f-c72b-4a50-a04b-0186f81af7a9" />
<img width="1216" height="908" alt="image" src="https://github.com/user-attachments/assets/9e4a162f-b5fd-4bd1-b3e1-da7711bb895e" />
<img width="1221" height="909" alt="image" src="https://github.com/user-attachments/assets/50d2f14d-7613-4108-946f-60347b767e1b" />


A professional stage timing and broadcast graphics application built with React, TypeScript, and Electron. Designed for live events, houses of worship, and professional broadcast environments.

## 📝 What’s New in v2.0.1

### ▶️ Overlay: Program Info (formerly “Lower Third”)
- Program Info overlay with title, subtitle and speaker lines
- Accurate staging preview that matches the live output
- Positioning fixes: horizontal X and overall scale behave consistently
- Theme toggle (Dark/Light) with crisp typography
- Image slot for logo/minister photo

### 🎚️ Controls & UX
- Touch‑friendly sliders with larger knobs across Overlay controls
- Overall scale and font size sliders provide smoother control
- Custom color picker for chroma key background (in addition to quick swatches)
- Responsive widescreen layout that uses more space when maximized
<img width="1218" height="894" alt="image" src="https://github.com/user-attachments/assets/6e0ddd06-76e5-4619-9c52-f8c2f43de581" />

### 🖥️ Multi‑Screen Improvements
- Target Display shows all secondary screens with status tags:
  - “In‑use: Timer” when used by Timer Control
  - “In‑use: Overlay” when broadcasting overlay
  - “Available” for free screens
- Display list refreshes when opening Overlay Control

### 🧭 Navigation & Guides
- Full‑page Guide with two sections: Timer Control Guide and Overlay Control Guide
- Guide opens directly to the relevant section from each module


> Tip: You can run Timer Control on one screen and Program Info on another. Use Target Display selectors to route each output independently.

---

## 📺 Broadcast Overlay System
- **Program Info**: Professional lower‑third style overlay (title, subtitle, speaker)
- **Independent Control**: Separate fields for Program Name, Message Title, and Minister/Speaker
- **Themes**: High‑contrast Light and Dark
- **Tabbed Dashboard**: “Overlay Control”, **Bible**, and **Songs** provide focussed workspaces for overlay settings, scripture lookup/projector control, and upcoming song lyrics management
- **Chroma Key Support**: Quick swatches + full color picker for OBS/vMix integration
![Uploading image.png…]()

### 🎭 Cinematic "Up Next" Experience
- **Cinematic Animations**: New scale-in and gradient pulse animations for transition alerts.
- **Attention-Grabbing Sequence**: Improved 8-color rapid cycle sequence for maximum visibility.
- **On-Screen Progress**: Added a countdown progress bar to notification overlays.

### ⚙️ System Improvements
- **Tab-Based Navigation**: Organized the main dashboard into "Timer Control", "Overlay Control", **Bible**, and **Songs** tabs.  The Bible screen provides verse lookup and multi‑display projection; the Songs tab is a placeholder for future lyrics support.
- **Performance Protection**: Disabled background throttling in Electron to ensure frame-perfect timer accuracy.
- **Persistent Routing**: Improved window loading logic using `HashRouter` for guaranteed secondary display stability.

## ✨ Key Features
<img width="674" height="517" alt="image" src="https://github.com/user-attachments/assets/a23648a2-674b-43bd-88ca-653b2a6964d7" />

### 🎭 Massive "Up Next" Display
- **Attention-grabbing color sequence**: 8 bright colors cycling rapidly for 1.6 seconds
- **Massive text sizes**: Program names up to 192px (12rem) for distant visibility
- **Duration display**: Shows exact minutes prominently
- **Full screen coverage**: Maximum visual impact for stage presentations

<img width="1920" height="1079" alt="image" src="https://github.com/user-attachments/assets/a4444d3d-746a-4d6c-ab60-d00bca3e8786" />

### ⏱️ Advanced Timer System
- **Dual Timer Display**: Setup timer for preparation + Live timer with fullscreen
- **Background timer protection**: Prevents pausing when window is in background
- **Extra time management**: Add bonus time during presentations
- **Timer history**: Track and replay previous timers (48-hour auto-expiration)
- **Single instance protection**: Prevents multiple app windows

<img width="540" height="661" alt="image" src="https://github.com/user-attachments/assets/8cc324bf-c111-4987-97aa-6208ab0fd29a" />
<img width="1037" height="934" alt="image" src="https://github.com/user-attachments/assets/9984b85b-06ca-4ba2-b747-c013ef5747e6" />

### 📋 Program Management
- **Category organization**: Group programs by event segments
- **Program counts**: Visual badges showing programs per category
- **Export/Import**: CSV template for bulk program management
- **Quick program selection**: One-click program timing
- **"Up Next" notifications**: Send program alerts with massive display

### 🚨 Enhanced Alert System
- **Custom alert messages**: Display any text on screen
- **Flash alerts**: Attention-grabbing flashing mode
- **Scrolling text display**: Smooth text animation
- **Alert consistency**: Identical display on main and live screens

<img width="482" height="323" alt="image" src="https://github.com/user-attachments/assets/bde49a8f-c82f-4340-b379-940bf6ca84b7" />

### 🎨 Display Customization
- **Adjustable timer sizes**: Scale all display elements
- **Custom backgrounds**: Image, Video, or Webcam support
- **Splash screen customization**: Default gradient or custom image
- **Clock display option**: Show current time
- **Custom scrollbars**: Professional UI throughout

![Uploading image.png…]()

### 🖥️ Multi-Screen Support
- **Automatic detection**: Opens on secondary screen when available
- **Display switching**: Easy switching between multiple displays
- **Taskbar integration**: Secondary window hidden from taskbar
- **Cross-screen synchronization**: Consistent alerts across displays

### 💾 Data Management
- **Persistent storage**: All data saved locally
- **Export/Import programs**: CSV template system
- **Category management**: Safe deletion with confirmation modals
- **Cache management**: Clear cache option with data preservation
- **Auto-backup**: Timer history with expiration

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Desktop**: Electron
- **Icons**: Lucide React
- **Server**: Node.js HTTP server (bundled)

## 📁 Project Structure

```
flexible-stage-timer/
├── vite-core/                 # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── types/            # TypeScript definitions
│   │   └── main.tsx          # App entry point
│   └── dist/                 # Built frontend files
├── public/                   # Static assets and built files
├── main.js                   # Electron main process
├── preload.js               # Electron preload script
└── package.json             # Project configuration
```

## 🚀 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Git](https://git-scm.com/) (for contributing)

### Quick Start

1. **Clone the repository:**
    ```bash
    git clone https://github.com/johnbenet009/flexible-stage-timer.git
    cd flexible-stage-timer
    ```

2. **Install dependencies:**
    ```bash
   # Install main dependencies
    npm install

   # Install frontend dependencies
    cd vite-core
    npm install
   cd ..
    ```

3. **Run in development:**
    ```bash
   # Start the app
    npm start
   
   # Or run frontend in dev mode
   npm run dev
    ```

### Building for Production

#### Windows Build (Recommended for All Platforms)
    ```bash
# Build clean directory version (removes language packs)
npm run build-clean

# Build NSIS installer with cleanup
npm run build-installer
```

**Why Windows Build for All Platforms?**
- ✅ **Works on Windows** - Native execution
- ✅ **Works on Ubuntu/Linux** - Via Wine (simple installation)
- ✅ **Works on macOS** - Via Wine or virtualization
- ✅ **Single build process** - No cross-compilation needed
- ✅ **Smaller distribution** - One executable for everyone

#### Linux Build (Optional - For Native Linux)
    ```bash
# Build Linux directory (recommended - avoids Windows symlink issues)
npm run build-linux

# Build clean directory version for Linux (removes language packs)
npm run build-linux-clean

# Try AppImage build (may have symlink issues on Windows)
npm run build-linux-appimage
```

#### Manual Build Steps
    ```bash
# 1. Build frontend and copy to public folder
      npm run build

# 2. Build Electron app directory
npx electron-builder --dir

# 3. Clean up unnecessary files (removes language packs)
node build-clean.js

# 4. Build NSIS installer (optional)
npx electron-builder --win nsis
```

#### Build Output

**Primary Distribution (Windows Build):**
- **`dist/Stage Timer App Setup 2.0.1.exe`** - NSIS installer (83.4 MB) - **Recommended for all platforms**
- **`dist/win-unpacked/`** - Clean app directory (no language packs)

**Alternative Distribution (Linux Build):**
- **`dist/linux-unpacked/`** - Clean app directory (no language packs)
- **`dist/Stage Timer App-2.0.1.AppImage`** - AppImage for distribution (may have issues on Windows)
- **`dist/stage-timer-app_2.0.1_amd64.deb`** - DEB package for Debian/Ubuntu (may have issues on Windows)

**Cleanup Scripts:**
- **`build-clean.js`** - Windows cleanup script
- **`build-clean-linux.js`** - Linux cleanup script

### Cross-Platform Building

**Building Linux on Windows:**
- Use `npm run build-linux` for directory builds (recommended)
- AppImage/DEB builds may fail due to Windows symlink permissions
- The `linux-unpacked` directory contains the complete Linux application

**Building Windows on Linux:**
- Use `npm run build-installer` for NSIS installer
- Use `npm run build-clean` for directory builds

### Installation Instructions

#### Windows Users
1. Download `Stage Timer App Setup 2.0.1.exe`
2. Run the installer
3. Launch from Start Menu or Desktop

#### Ubuntu/Linux Users (Recommended Method)
```bash
# Install Wine (one-time setup)
sudo apt update
sudo apt install wine

# Download and run the Windows installer
wine "Stage Timer App Setup 2.0.1.exe"
```

#### Alternative Linux Installation
```bash
# Install Wine and run the unpacked version directly
sudo apt install wine
wine "win-unpacked/Stage Timer App.exe"

# Or use native Linux build (requires manual setup)
chmod +x "linux-unpacked/Stage Timer App"
./"linux-unpacked/Stage Timer App"
```

#### macOS Users
```bash
# Install Wine via Homebrew
brew install wine-stable

# Run the Windows executable
wine "Stage Timer App Setup 2.0.1.exe"
```

## 📖 Usage Guide

### Basic Timer Controls
- **Setup Timer**: Prepare timing with +/- controls
- **Live Timer**: Fullscreen display for presentations
- **Keyboard Shortcuts**: Space (start/pause), S (stop), R (reset), A (attention)

### Program Management
1. **Create Categories**: Organize programs by event type
2. **Add Programs**: Use the modal form with duration controls
3. **Quick Start**: Click program name to start timing
4. **Send Notifications**: Use "Up Next" to alert audience


### Display Settings
- **Timer Sizes**: Adjust all display elements
- **Backgrounds**: Upload images, videos, or use webcam
- **Splash Screen**: Customize startup display
- **Multi-Screen**: Switch between available displays

## 💬 Story: How This Was Built
It began in my church—we needed a simple way to show a timer and manage services efficiently. Most options we found were paid, limited, or simply not tailored for church workflows. I asked: what if I build something churches can use for free, with the features we actually need?

By the grace of God, this app came to life and has served us faithfully ever since. It continues to grow with real‑world feedback from church and live‑event use. I’m John O., and I keep this free and open source so anyone can fork, improve, and bless their community.

If you build on this, please share your improvements! PRs are welcome.

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following the existing code style
4. **Test thoroughly** - ensure all features work correctly
5. **Build and test** the installer
6. **Commit with clear messages:**
   ```bash
   git commit -m "feat: add new timer feature"
   ```
7. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Create a Pull Request** with detailed description

### Code Standards

- **TypeScript**: Use strict typing
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS utility classes
- **Commits**: Follow conventional commit format
- **Testing**: Test on multiple screen configurations

### Pull Request Guidelines

- **Clear title**: Describe the feature/fix
- **Detailed description**: Explain what changed and why
- **Screenshots**: For UI changes
- **Testing notes**: How to test the changes
- **Breaking changes**: Document any breaking changes

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## 🐛 Bug Reports

When reporting bugs, please include:

1. **OS and version**
2. **App version** (check Help > About)
3. **Steps to reproduce**
4. **Expected vs actual behavior**
5. **Screenshots** if applicable

## 📄 License

This project is licensed under the [MIT License](LICENSE.txt).

## 👨‍💻 Author

**John Benet (John O.)** - [@johnbenet009](https://github.com/johnbenet009)

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide React](https://lucide.dev/)
- Packaged with [Electron](https://www.electronjs.org/)
- Built with [Vite](https://vitejs.dev/)

---

**Free, open source, and ready for professional stage presentations. Fork it, improve it, and share it.** 🎭✨ 
