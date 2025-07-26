const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const products = [
  { id: 1, name: "طقم أواني طبخ", price: 89000, rating: 4.5, reviewCount: 23 },
  { id: 2, name: "مقلاة مانعة للالتصاق", price: 45000, rating: 4.3, reviewCount: 17 },
  { id: 3, name: "خلاط كهربائي", price: 125000, rating: 4.7, reviewCount: 31 }
];

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مستلزمات بيوتنا - المتجر الأحدث في العراق</title>
  <style>
    * { font-family: Arial, sans-serif; direction: rtl; margin: 0; padding: 0; box-sizing: border-box; }
    body { background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: #1f2937; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; color: white; padding: 2rem 0; }
    .logo { font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
    .main-content { background: white; border-radius: 20px; padding: 2rem; margin: 2rem 0; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    .products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0; }
    .product-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; background: #f9fafb; transition: transform 0.3s ease; }
    .product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .product-image { width: 100%; height: 150px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 3rem; margin-bottom: 1rem; }
    .product-name { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; color: #1f2937; }
    .product-price { font-size: 1.5rem; font-weight: 700; color: #0f766e; margin-bottom: 1rem; }
    .btn { background: #0f766e; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 8px; width: 100%; cursor: pointer; transition: background 0.3s ease; }
    .btn:hover { background: #0d9488; }
    .contact-info { background: #0f766e; color: white; padding: 2rem; border-radius: 12px; text-align: center; margin: 2rem 0; }
    @media (max-width: 768px) { .container { padding: 10px; } .products-grid { grid-template-columns: 1fr; gap: 1rem; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏠 مستلزمات بيوتنا</div>
      <div>المتجر الأحدث في العراق</div>
    </div>
    <div class="main-content">
      <h2 style="text-align: center; margin-bottom: 2rem; color: #0f766e;">منتجاتنا المميزة</h2>
      <div class="products-grid" id="products-container"></div>
      <div class="contact-info">
        <div style="font-size: 1.5rem; margin-bottom: 1rem;">اطلب الآن</div>
        <div>📧 البريد الإلكتروني: Lasker189@gmail.com<br>🌐 الموقع الإلكتروني متاح 24/7</div>
      </div>
    </div>
  </div>
  <script>
    async function loadProducts() {
      try {
        const response = await fetch('/api/products');
        const products = await response.json();
        const container = document.getElementById('products-container');
        container.innerHTML = products.map(product => 
          '<div class="product-card"><div class="product-image">🍳</div><div class="product-name">' + product.name + '</div><div class="product-price">' + parseInt(product.price).toLocaleString() + ' د.ع</div><button class="btn" onclick="orderProduct()">اطلب الآن</button></div>'
        ).join('');
      } catch (error) {
        document.getElementById('products-container').innerHTML = '<div style="text-align: center; padding: 2rem;"><h3>مرحباً بكم في متجر مستلزمات بيوتنا</h3><p>للطلب يرجى التواصل معنا على Lasker189@gmail.com</p></div>';
      }
    }
    function orderProduct() { alert('للطلب يرجى التواصل معنا على البريد الإلكتروني: Lasker189@gmail.com'); }
    window.addEventListener('load', loadProducts);
  </script>
</body>
</html>`);
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
