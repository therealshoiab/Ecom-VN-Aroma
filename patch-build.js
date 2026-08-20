const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      files = files.concat(walk(filePath));
    } else if (filePath.endsWith('.js')) {
      files.push(filePath);
    }
  });
  return files;
}

const targetDir = path.join(__dirname, '.vercel', 'output');
if (!fs.existsSync(targetDir)) {
  console.error('.vercel/output directory does not exist. Run pages:build first.');
  process.exit(1);
}

console.log('Patching async_hooks imports in build files...');
const files = walk(targetDir);
let patchCount = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace imports of async_hooks without node: prefix
  // Matches from"async_hooks" or from'async_hooks' or require("async_hooks") etc.
  if (content.includes('from"async_hooks"') || content.includes("from'async_hooks'")) {
    content = content.replace(/from["']async_hooks["']/g, 'from"node:async_hooks"');
    changed = true;
  }
  if (content.includes('require("async_hooks")') || content.includes("require('async_hooks')")) {
    content = content.replace(/require\(["']async_hooks["']\)/g, 'require("node:async_hooks")');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`- Patched: ${path.relative(targetDir, file)}`);
    patchCount++;
  }
});

console.log(`Finished patching. Total files patched: ${patchCount}`);
