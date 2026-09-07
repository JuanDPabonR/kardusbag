// generar-bearer.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Tu user_id de Clerk
const userId = 'user_3Itcp4WljMV6qoXvVE14He7PEIF'; // Pon tu user_id real

// Si Clerk tiene CLERK_JWT_KEY en tu .env, o usa un secreto de desarrollo
const token = jwt.sign(
  {
    sub: userId,
    iss: 'https://clerk.kardusbag.com',
  },
  process.env.CLERK_SECRET_KEY,
  { expiresIn: '30d' },
);

console.log('\n================ TU BEARER TOKEN (30 DÍAS) ================');
console.log(token);
console.log('===========================================================\n');
