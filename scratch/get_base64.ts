import fs from 'fs';
const image = fs.readFileSync('test.jpg');
const base64 = image.toString('base64');
console.log(base64);
