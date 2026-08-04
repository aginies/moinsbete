const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_SVG = path.join(__dirname, '../public/icon-512.svg');
const ICON_PNG_1024 = path.join(__dirname, '../public/icon-1024.png');

// android mipmap densities
const ANDROID_DENSITIES = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

// ios icon sizes
const IOS_ICONS = [
  { file: 'AppIcon-29x29@1x.png', size: 29 },
  { file: 'AppIcon-29x29@2x.png', size: 58 },
  { file: 'AppIcon-29x29@3x.png', size: 87 },
  { file: 'AppIcon-40x40@1x.png', size: 40 },
  { file: 'AppIcon-40x40@2x.png', size: 80 },
  { file: 'AppIcon-40x40@3x.png', size: 120 },
  { file: 'AppIcon-60x60@2x.png', size: 120 },
  { file: 'AppIcon-60x60@3x.png', size: 180 },
  { file: 'AppIcon-76x76@1x.png', size: 76 },
  { file: 'AppIcon-76x76@2x.png', size: 152 },
  { file: 'AppIcon-83.5x83.5@2x.png', size: 167 },
  { file: 'AppIcon-1024x1024@1x.png', size: 1024 }
];

async function generateIcons() {
  console.log('converting svg to 1024x1024 png...');
  
  // first convert svg to 1024x1024
  await sharp(ICON_SVG)
    .resize(1024, 1024)
    .png()
    .toFile(ICON_PNG_1024);
  
  console.log('generated icon-1024.png');
  
  // android icons
  for (const [density, size] of Object.entries(ANDROID_DENSITIES)) {
    const dest = path.join(__dirname, `../android/app/src/main/res/mipmap-${density}/ic_launcher.png`);
    await sharp(ICON_PNG_1024)
      .resize(size, size)
      .png()
      .toFile(dest);
    console.log(`generated android mipmap-${density}/ic_launcher.png (${size}x${size})`);
  }
  
  // android round icons
  for (const [density, size] of Object.entries(ANDROID_DENSITIES)) {
    const dest = path.join(__dirname, `../android/app/src/main/res/mipmap-${density}/ic_launcher_round.png`);
    await sharp(ICON_PNG_1024)
      .resize(size, size)
      .png()
      .toFile(dest);
    console.log(`generated android mipmap-${density}/ic_launcher_round.png (${size}x${size})`);
  }
  
  // ios icons
  const iosDir = path.join(__dirname, '../ios/App/App/AppIcon.appiconset');
  if (!fs.existsSync(iosDir)) {
    fs.mkdirSync(iosDir, { recursive: true });
  }
  
  for (const { file, size } of IOS_ICONS) {
    const dest = path.join(iosDir, file);
    await sharp(ICON_PNG_1024)
      .resize(size, size)
      .png()
      .toFile(dest);
    console.log(`generated ios AppIcon.appiconset/${file} (${size}x${size})`);
  }
  
  // splash screen (2732x2732 for ipad, will scale for android)
  const splashDest = path.join(__dirname, '../ios/App/App/SplashScreen.png');
  await sharp(ICON_PNG_1024)
    .resize(2732, 2732)
    .png()
    .toFile(splashDest);
  console.log('generated ios SplashScreen.png (2732x2732)');
  
  // android splash (1080x1920 for hdpi)
  const androidSplashDest = path.join(__dirname, '../android/app/src/main/res/drawable/splash.png');
  await sharp(ICON_PNG_1024)
    .resize(1080, 1920)
    .png()
    .toFile(androidSplashDest);
  console.log('generated android drawable/splash.png (1080x1920)');
  
  console.log('\nall icons generated!');
}

generateIcons().catch(err => {
  console.error('error:', err);
  process.exit(1);
});
