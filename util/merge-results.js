const path = require('path');
const fs = require('fs');

const [,,...files] = process.argv;

const set = new Set();
for (const file of files.slice(1)) {
  const content = fs.readFileSync(file, { encoding: "utf-8" });
  console.log(`Join file ${file}`);
  const data = content.split("\n");
  for (const el of data) {
    if (el.trim()) set.add(el.trim());
  }
}

console.log(`Write file ${files[0]}`);
fs.writeFileSync(files[0], Array.from(set).join("\n"));
