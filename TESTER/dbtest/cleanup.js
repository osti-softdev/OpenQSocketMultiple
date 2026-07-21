const fs = require('fs');
const path = require('path');

// Determine the project root dynamically so this script still works
// even after it moves itself into TESTER/dbtest/
let projectRoot = __dirname;
if (__dirname.includes(path.join('TESTER', 'dbtest'))) {
    projectRoot = path.join(__dirname, '..', '..');
}

const filesToMove = [
  'backend/utilities/dump_schema_data.js',
  'backend/utilities/schema_dump.json',
  'backend/utilities/check_schema.js',
  'backend/utilities/check_services.js',
  'backend/utilities/check_last_date.js',
  'backend/utilities/seed_transactions.js',
  'cleanup.js' // Include this script itself!
];

const targetDir = path.join(projectRoot, 'TESTER', 'dbtest');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

let movedCount = 0;
filesToMove.forEach(file => {
  // We resolve the source path relative to the projectRoot
  const sourcePath = path.join(projectRoot, file);
  const fileName = path.basename(file);
  const destPath = path.join(targetDir, fileName);
  
  if (fs.existsSync(sourcePath)) {
    // Skip if it's already in the destination
    if (sourcePath === destPath) return;

    try {
        if (fileName.endsWith('.js') && fileName !== 'cleanup.js') {
            // Read content and fix relative path to the database config
            // from `../config/db.db` to `../../backend/config/db.db`
            let content = fs.readFileSync(sourcePath, 'utf8');
            content = content.replace(/\.\.\/config/g, '../../backend/config');
            
            // For dump_schema_data.js, also fix the schema_dump.json output path
            if (fileName === 'dump_schema_data.js') {
               content = content.replace(/'schema_dump\.json'/g, "'../../backend/utilities/schema_dump.json'");
            }
            
            fs.writeFileSync(destPath, content);
            fs.unlinkSync(sourcePath);
        } else {
            // For JSON or the cleanup script itself, just rename directly
            fs.renameSync(sourcePath, destPath);
        }
        console.log(`Moved: ${fileName} -> TESTER/dbtest/${fileName}`);
        movedCount++;
    } catch(e) {
        console.error(`Failed to move ${fileName}: ${e.message}`);
    }
  }
});

console.log(`\nMove complete! Relocated ${movedCount} test files.`);
