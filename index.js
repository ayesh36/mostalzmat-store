const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const products = [
  { id: 1, name: "طقم أواني طبخ", price: 89000, rating: 4.5, reviewCount: 23, categoryId: 1 },
  { id: 2, name: "مقلاة مانعة للالتصاق", price: 45000, rating: 4.3, reviewCount: 17, categoryId: 1 },
  { id: 3, name: "خلاط كهربائي", price: 125000, rating: 4.7, reviewCount: 31, categoryId: 2 }
];

app.get('/', (req, res) => {
  res.send('<h1>مستلزمات بيوتنا</h1><p>المتجر الأحدث في العراق</p>');
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
});
