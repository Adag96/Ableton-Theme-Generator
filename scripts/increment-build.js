const fs = require('fs');
const path = require('path');

const buildNumberFile = path.join(__dirname, '..', '.build-number');

let buildNumber = 1;

if (fs.existsSync(buildNumberFile)) {
  const content = fs.readFileSync(buildNumberFile, 'utf8');
  buildNumber = parseInt(content, 10) || 1;
}

// Increment build number
buildNumber++;

// Write new build number
fs.writeFileSync(buildNumberFile, buildNumber.toString());

// Set environment variable
process.env.BUILD_NUMBER = buildNumber.toString();

console.log(`Build number: ${buildNumber}`);
