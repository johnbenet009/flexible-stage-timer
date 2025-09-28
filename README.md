# Stage Timer App v2.0

<img width="1043" height="953" alt="image" src="https://github.com/user-attachments/assets/10d812ce-50c5-42cb-818b-e015ea149a70" />

![Uploading image.png…]()

A professional stage timing application built with React, TypeScript, and Electron, designed for live events, presentations, and performances. Features a massive attention-grabbing "Up Next" display and comprehensive program management.

## ✨ Key Features
<img width="674" height="517" alt="image" src="https://github.com/user-attachments/assets/a23648a2-674b-43bd-88ca-653b2a6964d7" />

### 🎭 Massive "Up Next" Display
- **Attention-grabbing color sequence**: 8 bright colors cycling rapidly for 1.6 seconds
- **Massive text sizes**: Program names up to 192px (12rem) for distant visibility
- **Duration display**: Shows exact minutes prominently
- **Full screen coverage**: Maximum visual impact for stage presentations

<img width="1058" height="955" alt="image" src="https://github.com/user-attachments/assets/d2777b9d-df06-4ca0-9203-1a25f7e4de54" />

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

#### Quick Build (Recommended)
    ```bash
# Build clean directory version (removes language packs)
npm run build-clean

# Build NSIS installer with cleanup
npm run build-installer
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
- **`dist/Stage Timer App Setup 2.0.0.exe`** - NSIS installer for distribution
- **`dist/win-unpacked/`** - Clean app directory (no language packs)
- **`build-clean.js`** - Automated cleanup script

#### Build Optimization
The build process automatically removes:
- Language packs (saves ~50+ files)
- Unnecessary Chrome files
- Duplicate resources

This results in a significantly smaller and cleaner build.

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

**John Benet** - [@johnbenet009](https://github.com/johnbenet009)

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide React](https://lucide.dev/)
- Packaged with [Electron](https://www.electronjs.org/)
- Built with [Vite](https://vitejs.dev/)

---

**Ready for professional stage presentations!** 🎭✨ 