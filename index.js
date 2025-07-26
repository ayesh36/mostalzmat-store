const express = require('express');
const path = require('path');
const compression = require('compression');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression({ level: 9 }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'mostalzmat-store-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Email configuration
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.get('/api/categories', async (req, res) => {
  try {
    const categories = [
      { id: 1, name: "Cooking Tools", nameAr: "أدوات الطبخ", icon: "🍳" },
      { id: 2, name: "Storage", nameAr: "التخزين", icon: "📦" },
      { id: 3, name: "Coffee & Tea", nameAr: "القهوة والشاي", icon: "☕" },
      { id: 4, name: "Baking", nameAr: "الخبز والحلويات", icon: "🧁" },
      { id: 5, name: "Dining", nameAr: "أدوات المائدة", icon: "🍽️" }
    ];
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = [
      {
        id: 1,
        productCode: "BYT123456",
        name: "طقم سكاكين المطبخ",
        nameAr: "طقم سكاكين المطبخ",
        description: "طقم سكاكين عالي الجودة للمطبخ",
        price: "45000",
        imageUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23f0f0f0'/><text x='100' y='100' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' fill='%23666'>🔪 طقم سكاكين</text></svg>",
        categoryId: 1,
        rating: "4.5",
        reviewCount: 25,
        inStock: true,
        featured: true
      },
      {
        id: 2,
        productCode: "BYT234567",
        name: "طقم أواني الطبخ",
        nameAr: "طقم أواني الطبخ",
        description: "طقم أواني من الستانلس ستيل",
        price: "89000",
        imageUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23f0f0f0'/><text x='100' y='100' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' fill='%23666'>🍳 طقم أواني</text></svg>",
        categoryId: 1,
        rating: "4.3",
        reviewCount: 18,
        inStock: true,
        featured: false
      },
      {
        id: 3,
        productCode: "BYT345678",
        name: "علبة حفظ الطعام",
        nameAr: "علبة حفظ الطعام",
        description: "علبة حفظ بغطاء محكم",
        price: "25000",
        imageUrl: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'><rect width='200' height='200' fill='%23f0f0f0'/><text x='100' y='100' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' fill='%23666'>📦 علبة حفظ</text></svg>",
        categoryId: 2,
        rating: "4.2",
        reviewCount: 12,
        inStock: true,
        featured: true
      }
    ];
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerInfo, items, total } = req.body;
    
    const emailHtml = `
      <h2>طلب جديد من متجر مستلزمات بيوتنا</h2>
      <h3>بيانات العميل:</h3>
      <p><strong>الاسم:</strong> ${customerInfo.name}</p>
      <p><strong>الهاتف:</strong> ${customerInfo.phone}</p>
      <p><strong>العنوان:</strong> ${customerInfo.address}</p>
      
      <h3>المنتجات المطلوبة:</h3>
      <table border="1" style="border-collapse: collapse; width: 100%;">
        <tr><th>المنتج</th><th>الكمية</th><th>السعر</th></tr>
        ${items.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${item.price} د.ع</td>
          </tr>
        `).join('')}
      </table>
      
      <h3><strong>المجموع الكلي: ${total} د.ع</strong></h3>
    `;

    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: 'Lasker189@gmail.com',
        subject: 'طلب جديد من متجر مستلزمات بيوتنا',
        html: emailHtml
      });
    }

    console.log('طلب جديد:', { customerInfo, items, total });
    res.json({ success: true, orderId: Date.now() });
  } catch (error) {
    console.error('Order processing error:', error);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

// Serve main page
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 مستلزمات بيوتنا يعمل على المنفذ ${PORT}`);
  console.log(`🌐 الموقع: https://mostalzmat-store.up.railway.app`);
});
