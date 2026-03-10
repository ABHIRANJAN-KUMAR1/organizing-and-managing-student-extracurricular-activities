const fs = require('fs');
const src = fs.readFileSync('./client/pages/Register.tsx', 'utf8');
const dest = src.replace(/Register/g, 'Login');
fs.writeFileSync('./client/pages/Login.tsx', dest);
console.log('Done!');
