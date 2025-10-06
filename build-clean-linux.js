const fs = require('fs');
const path = require('path');

// Remove language packs and unnecessary files after electron-builder for Linux
function cleanLinuxBuild() {
  const distPath = path.join(__dirname, 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.log('No dist folder found');
    return;
  }

  // Remove language packs from linux-unpacked
  const localesPath = path.join(distPath, 'linux-unpacked', 'locales');
  if (fs.existsSync(localesPath)) {
    fs.rmSync(localesPath, { recursive: true, force: true });
    console.log('Removed language packs from linux-unpacked');
  }

  // Remove language packs from AppImage if exists
  const appImageLocalesPath = path.join(distPath, 'stage-timer-app-linux-x64', 'locales');
  if (fs.existsSync(appImageLocalesPath)) {
    fs.rmSync(appImageLocalesPath, { recursive: true, force: true });
    console.log('Removed language packs from AppImage');
  }

  // Remove duplicate resources
  const duplicatePublicPath = path.join(distPath, 'linux-unpacked', 'resources', 'public');
  if (fs.existsSync(duplicatePublicPath)) {
    fs.rmSync(duplicatePublicPath, { recursive: true, force: true });
    console.log('Removed duplicate public resources');
  }

  // Remove unnecessary Chrome files
  const chromeFiles = ['chrome_100_percent.pak', 'chrome_200_percent.pak'];
  const linuxUnpackedPath = path.join(distPath, 'linux-unpacked');
  
  chromeFiles.forEach(file => {
    const filePath = path.join(linuxUnpackedPath, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed ${file}`);
    }
  });

  // Remove unnecessary files specific to Linux
  const unnecessaryFiles = [
    'libEGL.so',
    'libGLESv2.so',
    'vk_swiftshader_icd.json',
    'vk_swiftshader.so'
  ];
  
  unnecessaryFiles.forEach(file => {
    const filePath = path.join(linuxUnpackedPath, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Removed ${file}`);
    }
  });

  console.log('Linux build cleanup completed!');
}

cleanLinuxBuild();
