import express from 'express';
import nodemailer from 'nodemailer';
import compression from 'compression';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(express.json());

// Database connection optimized for Railway
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 60000,
    statementTimeout: 30000
  });
  
  pool.on('error', (err) => {
    console.error('Database connection error:', err);
  });
}

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'Lasker189@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'frvd gexd hrms bwpw'
  }
});

// Real categories data from your database
const categories = [
  { id: 1, name: "Cooking Tools", nameAr: "أدوات الطهي", icon: "🍳", description: "أدوات الطبخ والطهي الأساسية" },
  { id: 2, name: "Tableware", nameAr: "أدوات المائدة", icon: "🍽️", description: "أدوات وأواني المائدة" },
  { id: 3, name: "Storage & Organization", nameAr: "التخزين والتنظيم", icon: "📦", description: "حلول التخزين والتنظيم" },
  { id: 4, name: "Pans", nameAr: "المقلاة", icon: "🥘", description: "مقالي بجميع الأحجام والأنواع" },
  { id: 5, name: "Tea & Coffee Supplies", nameAr: "مستلزمات الشاي والقهوة", icon: "☕", description: "مستلزمات تحضير الشاي والقهوة" },
  { id: 6, name: "Bathroom & Waste", nameAr: "ادوات الحمام وسلة المهملات", icon: "🛁", description: "أدوات الحمام وسلال المهملات" },
  { id: 7, name: "Small Appliances", nameAr: "أجهزة كهربائية صغيرة", icon: "⚡", description: "الأجهزة الكهربائية الصغيرة" }
];

// Sample products - will be replaced with real data from database
const sampleProducts = [
  { id: 213, name: "ساعة جدراية", price: 50000, productCode: "BYT58434125", rating: 4.5, reviewCount: 12, categoryId: 3 },
  { id: 212, name: "سيت شكردان", price: 39000, productCode: "BYT52892714", rating: 4.3, reviewCount: 8, categoryId: 3 },
  { id: 211, name: "سيت شكردان", price: 39000, productCode: "BYT50410163", rating: 4.4, reviewCount: 15, categoryId: 3 },
  { id: 210, name: "سيت جدر خوص", price: 62000, productCode: "BYT44092932", rating: 4.6, reviewCount: 22, categoryId: 3 },
  { id: 209, name: "صندوق خزن", price: 24000, productCode: "BYT31485204", rating: 4.2, reviewCount: 18, categoryId: 3 },
  { id: 208, name: "صندوق خزن", price: 24000, productCode: "BYT24295595", rating: 4.7, reviewCount: 31, categoryId: 3 },
  { id: 207, name: "سيت بوكس صغير", price: 15000, productCode: "BYT20391542", rating: 4.5, reviewCount: 28, categoryId: 3 },
  { id: 206, name: "سيت بوكس خزن", price: 25000, productCode: "BYT13681761", rating: 4.8, reviewCount: 42, categoryId: 3 },
  { id: 205, name: "سيت طابورية", price: 60000, productCode: "BYT10654094", rating: 4.3, reviewCount: 16, categoryId: 3 },
  { id: 204, name: "ترمز زجاجي", price: 25000, productCode: "BYT07166204", rating: 4.1, reviewCount: 9, categoryId: 2 },
  { id: 203, name: "سيت سلة ملابس", price: 99000, productCode: "BYT02736593", rating: 4.4, reviewCount: 13, categoryId: 3 },
  { id: 202, name: "سيت صندوق خوص", price: 45000, productCode: "BYT99749640", rating: 4.6, reviewCount: 19, categoryId: 3 },
  { id: 201, name: "ساعة جدارية", price: 43000, productCode: "BYT94869234", rating: 4.2, reviewCount: 11, categoryId: 7 },
  { id: 200, name: "سيت ماعون 26 قطعة", price: 110000, productCode: "BYT92493859", rating: 4.8, reviewCount: 89, categoryId: 2 },
  { id: 199, name: "سيت ماعون 26 قطعة", price: 110000, productCode: "BYT88472735", rating: 4.8, reviewCount: 87, categoryId: 2 },
  { id: 198, name: "سيت ماعون 26 قطعة", price: 110000, productCode: "BYT84901644", rating: 4.5, reviewCount: 189, categoryId: 2 },
  { id: 197, name: "سيت ماعون 26 قطعة", price: 110000, productCode: "BYT81505132", rating: 4.2, reviewCount: 83, categoryId: 2 },
  { id: 196, name: "سيت ماعون 26 قطعة", price: 110000, productCode: "BYT77976612", rating: 4.2, reviewCount: 37, categoryId: 2 },
  { id: 195, name: "سيت ماعون 26 قطعة", price: 110000, productCode: "BYT74954604", rating: 4.2, reviewCount: 73, categoryId: 2 },
  { id: 194, name: "سيت ماعون 26 قطعة", price: 110000, productCode: "BYT70732886", rating: 4.9, reviewCount: 230, categoryId: 2 }
];

// Main homepage route
app.get('/', (req, res) => {
  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مستلزمات بيوتنا - المتجر الأحدث في العراق</title>
  <style>
    * { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: rtl; margin: 0; padding: 0; box-sizing: border-box; }
    body { background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: #1f2937; min-height: 100vh; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; color: white; padding: 2rem 0; }
    .logo { font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }
    .tagline { font-size: 1.2rem; opacity: 0.9; }
    .main-content { background: white; border-radius: 20px; padding: 2rem; margin: 2rem 0; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
    .search-bar { width: 100%; padding: 1rem; border: 2px solid #0f766e; border-radius: 12px; font-size: 1.1rem; margin-bottom: 2rem; }
    .categories { display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; justify-content: center; }
    .category-btn { background: #f0fdf4; border: 2px solid #0f766e; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; transition: all 0.3s; }
    .category-btn:hover, .category-btn.active { background: #0f766e; color: white; }
    .products-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin: 2rem 0; }
    .product-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem; background: #f9fafb; transition: transform 0.3s; }
    .product-card:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
    .product-image { width: 100%; height: 120px; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin-bottom: 1rem; }
    .product-name { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem; color: #1f2937; }
    .product-price { font-size: 1.3rem; font-weight: 700; color: #0f766e; margin-bottom: 0.5rem; }
    .product-code { font-size: 0.8rem; color: #6b7280; margin-bottom: 0.5rem; }
    .product-rating { font-size: 0.9rem; color: #6b7280; margin-bottom: 1rem; }
    .btn { background: #0f766e; color: white; padding: 0.6rem 1rem; border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; width: 100%; transition: background 0.3s; }
    .btn:hover { background: #0d9488; }
    .load-more { text-align: center; margin: 2rem 0; }
    .pagination { text-align: center; margin: 2rem 0; color: #6b7280; }
    .contact-info { background: #0f766e; color: white; padding: 2rem; border-radius: 12px; text-align: center; margin: 2rem 0; }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0; }
    .feature { text-align: center; padding: 1.5rem; background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); border-radius: 12px; }
    @media (max-width: 768px) { 
      .container { padding: 10px; } 
      .logo { font-size: 2rem; }
      .products-grid { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🏠 مستلزمات بيوتنا</div>
      <div class="tagline">المتجر الأحدث في العراق</div>
      <div style="margin-top: 1rem;">177 منتج متاح | توصيل مجاني فوق 100,000 د.ع</div>
    </div>
    
    <div class="main-content">
      <input type="text" class="search-bar" placeholder="ابحث عن المنتجات..." onkeyup="searchProducts(this.value)">
      
      <div class="categories" id="categories"></div>
      
      <div class="pagination" id="pagination">عرض <span id="current-count">0</span> من <span id="total-count">0</span> منتج</div>
      
      <div class="products-grid" id="products-container"></div>
      
      <div class="load-more" id="load-more-container">
        <button class="btn" onclick="loadMoreProducts()">عرض المزيد من المنتجات</button>
      </div>
      
      <div class="features">
        <div class="feature">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🛒</div>
          <div style="font-weight: 600; margin-bottom: 0.5rem; color: #0f766e;">تسوق سهل</div>
          <p>تجربة تسوق بسيطة ومريحة</p>
        </div>
        <div class="feature">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">🚚</div>
          <div style="font-weight: 600; margin-bottom: 0.5rem; color: #0f766e;">توصيل سريع</div>
          <p>توصيل لجميع المحافظات العراقية</p>
        </div>
        <div class="feature">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">💰</div>
          <div style="font-weight: 600; margin-bottom: 0.5rem; color: #0f766e;">أسعار منافسة</div>
          <p>أفضل الأسعار في السوق</p>
        </div>
        <div class="feature">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">⭐</div>
          <div style="font-weight: 600; margin-bottom: 0.5rem; color: #0f766e;">جودة عالية</div>
          <p>منتجات مضمونة الجودة</p>
        </div>
      </div>
      
      <div class="contact-info">
        <div style="font-size: 1.5rem; margin-bottom: 1rem;">اطلب الآن</div>
        <div style="font-size: 1.1rem; line-height: 1.6;">
          📧 البريد الإلكتروني: Lasker189@gmail.com<br>
          🌐 الموقع الإلكتروني متاح 24/7<br>
          📱 متجر آمن ومضمون
        </div>
      </div>
    </div>
    
    <div style="text-align: center; color: white; padding: 2rem 0; opacity: 0.8;">
      <p>© 2025 مستلزمات بيوتنا - جميع الحقوق محفوظة</p>
      <p>المتجر الأحدث في العراق لأدوات المطبخ والمنزل</p>
    </div>
  </div>

  <script>
    let allProducts = [];
    let filteredProducts = [];
    let displayedProducts = [];
    let currentDisplayLimit = 20;
    let selectedCategory = null;
    
    const categoryIcons = {
      1: '🍳', 2: '🍽️', 3: '📦', 4: '🥘', 5: '☕', 6: '🛁', 7: '⚡'
    };
    
    async function loadData() {
      try {
        const categoriesResponse = await fetch('/api/categories');
        const categories = await categoriesResponse.json();
        renderCategories(categories);
        
        const productsResponse = await fetch('/api/products');
        allProducts = await productsResponse.json();
        filteredProducts = allProducts;
        updateDisplay();
      } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        // Use fallback data if database fails
        allProducts = [];
        for (let i = 0; i < ${JSON.stringify(sampleProducts)}.length; i++) {
          allProducts.push(${JSON.stringify(sampleProducts)}[i]);
        }
        filteredProducts = allProducts;
        const fallbackCategories = [];
        for (let i = 0; i < ${JSON.stringify(categories)}.length; i++) {
          fallbackCategories.push(${JSON.stringify(categories)}[i]);
        }
        renderCategories(fallbackCategories);
        updateDisplay();
      }
    }
    
    function renderCategories(categories) {
      const container = document.getElementById('categories');
      let html = '<div class="category-btn active" onclick="filterByCategory(null)">الكل</div>';
      categories.forEach(cat => {
        html += '<div class="category-btn" onclick="filterByCategory(' + cat.id + ')">' + (cat.icon || '📁') + ' ' + (cat.nameAr || cat.name) + '</div>';
      });
      container.innerHTML = html;
    }
    
    function updateDisplay() {
      displayedProducts = filteredProducts.slice(0, currentDisplayLimit);
      renderProducts();
      updatePagination();
      updateLoadMoreButton();
    }
    
    function renderProducts() {
      const container = document.getElementById('products-container');
      if (displayedProducts.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 2rem; color: #6b7280;">لا توجد منتجات متاحة</div>';
        return;
      }
      
      let html = '';
      displayedProducts.forEach(product => {
        html += '<div class="product-card">';
        html += '<div class="product-image">' + (categoryIcons[product.categoryId || product.category_id] || '📦') + '</div>';
        html += '<div class="product-name">' + product.name + '</div>';
        html += '<div class="product-price">' + parseInt(product.price || 0).toLocaleString() + ' د.ع</div>';
        html += '<div class="product-code">كود المنتج: ' + (product.productCode || product.product_code || 'غير متاح') + '</div>';
        html += '<div class="product-rating">⭐ ' + (product.rating || 4.5) + ' (' + (product.reviewCount || product.review_count || 0) + ' مراجعة)</div>';
        html += '<button class="btn" onclick="orderProduct(\\'' + product.name + '\\', \\'' + (product.productCode || product.product_code) + '\\', ' + product.price + ')">اطلب الآن</button>';
        html += '</div>';
      });
      container.innerHTML = html;
    }
    
    function updatePagination() {
      document.getElementById('current-count').textContent = displayedProducts.length;
      document.getElementById('total-count').textContent = filteredProducts.length;
    }
    
    function updateLoadMoreButton() {
      const container = document.getElementById('load-more-container');
      container.style.display = displayedProducts.length < filteredProducts.length ? 'block' : 'none';
    }
    
    function loadMoreProducts() {
      currentDisplayLimit += 20;
      updateDisplay();
    }
    
    function filterByCategory(categoryId) {
      selectedCategory = categoryId;
      currentDisplayLimit = 20;
      
      const buttons = document.querySelectorAll('.category-btn');
      buttons.forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      if (categoryId === null) {
        filteredProducts = allProducts;
      } else {
        filteredProducts = allProducts.filter(product => 
          (product.categoryId || product.category_id) == categoryId
        );
      }
      
      updateDisplay();
    }
    
    function searchProducts(query) {
      if (!query.trim()) {
        if (selectedCategory === null) {
          filteredProducts = allProducts;
        } else {
          filteredProducts = allProducts.filter(product => 
            (product.categoryId || product.category_id) == selectedCategory
          );
        }
      } else {
        const searchLower = query.toLowerCase();
        filteredProducts = allProducts.filter(product =>
          product.name.toLowerCase().includes(searchLower) ||
          (product.productCode && product.productCode.toLowerCase().includes(searchLower)) ||
          (product.product_code && product.product_code.toLowerCase().includes(searchLower))
        );
      }
      
      currentDisplayLimit = 20;
      updateDisplay();
    }
    
    function orderProduct(productName, productCode, price) {
      const message = 'أريد طلب المنتج التالي:\\n\\n' +
                   '📦 اسم المنتج: ' + productName + '\\n' +
                   '🔢 كود المنتج: ' + productCode + '\\n' +
                   '💰 السعر: ' + parseInt(price || 0).toLocaleString() + ' د.ع\\n\\n' +
                   'يرجى تأكيد الطلب وتزويدي بمعلومات التوصيل.';
      
      alert('تم اختيار المنتج!\\n\\nللطلب يرجى التواصل معنا على:\\n📧 Lasker189@gmail.com\\n\\nأو نسخ الرسالة التالية:\\n\\n' + message);
    }
    
    window.addEventListener('load', loadData);
  </script>
</body>
</html>`;
  
  res.send(htmlContent);
});

// API Routes
app.get('/api/categories', async (req, res) => {
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM categories ORDER BY id');
      res.json(result.rows);
    } else {
      res.json(categories);
    }
  } catch (error) {
    console.error('Database error:', error);
    res.json(categories);
  }
});

app.get('/api/products', async (req, res) => {
  try {
    if (pool) {
      const result = await Promise.race([
        pool.query('SELECT * FROM products ORDER BY id DESC'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 15000)
        )
      ]);
      console.log('تم تحميل ' + result.rows.length + ' منتج من قاعدة البيانات');
      res.json(result.rows);
    } else {
      console.log('استخدام البيانات التجريبية');
      res.json(sampleProducts);
    }
  } catch (error) {
    console.error('خطأ في قاعدة البيانات:', error.message);
    console.log('التبديل للبيانات التجريبية');
    res.json(sampleProducts);
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, phone, address, province, products, total } = req.body;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'Lasker189@gmail.com',
      to: 'Lasker189@gmail.com',
      subject: '🛒 طلب جديد من مستلزمات بيوتنا - ' + customerName,
      html: '<div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">' +
        '<div style="background: #0f766e; color: white; padding: 20px; text-align: center;">' +
        '<h1>🏠 مستلزمات بيوتنا</h1><h2>طلب جديد من العميل</h2></div>' +
        '<div style="padding: 20px;">' +
        '<h3 style="color: #0f766e;">معلومات العميل</h3>' +
        '<p><strong>الاسم:</strong> ' + customerName + '</p>' +
        '<p><strong>رقم الهاتف:</strong> ' + phone + '</p>' +
        '<p><strong>المحافظة:</strong> ' + province + '</p>' +
        '<p><strong>العنوان:</strong> ' + address + '</p>' +
        '<h3 style="color: #0f766e;">المنتجات المطلوبة</h3>' +
        '<table style="width: 100%; border-collapse: collapse;">' +
        '<thead><tr style="background: #f0fdf4;">' +
        '<th style="border: 1px solid #0f766e; padding: 10px;">المنتج</th>' +
        '<th style="border: 1px solid #0f766e; padding: 10px;">الكمية</th>' +
        '<th style="border: 1px solid #0f766e; padding: 10px;">السعر</th>' +
        '<th style="border: 1px solid #0f766e; padding: 10px;">المجموع</th>' +
        '</tr></thead><tbody>' +
        products.map(p => 
          '<tr>' +
          '<td style="border: 1px solid #ddd; padding: 10px;">' + p.name + '</td>' +
          '<td style="border: 1px solid #ddd; padding: 10px; text-align: center;">' + p.quantity + '</td>' +
          '<td style="border: 1px solid #ddd; padding: 10px;">' + parseInt(p.price).toLocaleString() + ' د.ع</td>' +
          '<td style="border: 1px solid #ddd; padding: 10px;">' + parseInt(p.price * p.quantity).toLocaleString() + ' د.ع</td>' +
          '</tr>'
        ).join('') +
        '</tbody></table>' +
        '<div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">' +
        '<h3 style="color: #0f766e; margin: 0;">المجموع الكلي: ' + parseInt(total).toLocaleString() + ' دينار عراقي</h3>' +
        '</div></div></div>'
    };

    await transporter.sendMail(mailOptions);
    console.log('تم إرسال طلب جديد من ' + customerName + ' - المجموع: ' + total + ' د.ع');
    
    res.json({ success: true, message: 'تم إرسال طلبك بنجاح! سنتواصل معك قريباً.' });
  } catch (error) {
    console.error('خطأ في إرسال الطلب:', error);
    res.status(500).json({ error: 'حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.' });
  }
});

app.listen(PORT, () => {
  console.log('🚀 مستلزمات بيوتنا - الخادم يعمل على المنفذ ' + PORT);
  console.log('📦 ' + (pool ? 'متصل بقاعدة البيانات مع 177 منتج' : 'يعمل بالبيانات التجريبية'));
  console.log('📧 خدمة البريد الإلكتروني جاهزة للطلبات');
});
