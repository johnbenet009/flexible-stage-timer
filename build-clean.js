const fs = require('fs');
const path = require('path');

// Remove language packs and unnecessary files after electron-builder
function cleanBuild() {
  const distPath = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('No dist folder found');
    return;
  }

  // Remove language packs from win-unpacked
  const localesPath = path.join(distPath, 'win-unpacked', 'locales');
  if (fs.existsSync(localesPath)) {
    fs.rmSync(localesPath, { recursive: true, force: true });
    console.log('Removed language packs from win-unpacked');
  }

  // Remove language packs from packaged app if exists
  const packagedLocalesPath = path.join(distPath, 'stage-timer-app-win32-x64', 'locales');
  if (fs.existsSync(packagedLocalesPath)) {
    fs.rmSync(packagedLocalesPath, { recursive: true, force: true });
    console.log('Removed language packs from packaged app');
  }

  // Remove duplicate resources
  const duplicatePublicPath = path.join(distPath, 'win-unpacked', 'resources', 'public');
  if (fs.existsSync(duplicatePublicPath)) {
    fs.rmSync(duplicatePublicPath, { recursive: true, force: true });
    console.log('Removed duplicate public resources');
  }

  // Remove unnecessary Chrome files
  const chromeFiles = ['chrome_100_percent.pak', 'chrome_200_percent.pak'];
  const winUnpackedPath = path.join(distPath, 'win-unpacked');
  
  chromeFiles.forEach(file => {
    const filePath = path.join(winUnpackedPath, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed ${file}`);
    }
  });

  console.log('Build cleanup completed!');
}

cleanBuild();
