import express from 'express';
import { Pool } from 'pg';
import nodemailer from 'nodemailer';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - serve the built React app
app.use(express.static(path.join(__dirname, 'public')));

// Database connection for Railway
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 60000,
    statementTimeout: 45000
  });
  
  pool.on('error', (err) => {
    console.error('Database pool error:', err);
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

// Categories data matching your database
const categories = [
  { id: 1, name: "Cooking Tools", nameAr: "أدوات الطهي", icon: "🍳", description: "أدوات الطبخ والطهي الأساسية" },
  { id: 2, name: "Tableware", nameAr: "أدوات المائدة", icon: "🍽️", description: "أدوات وأواني المائدة" },
  { id: 3, name: "Storage & Organization", nameAr: "التخزين والتنظيم", icon: "📦", description: "حلول التخزين والتنظيم" },
  { id: 4, name: "Pans", nameAr: "المقلاة", icon: "🥘", description: "مقالي بجميع الأحجام والأنواع" },
  { id: 5, name: "Tea & Coffee Supplies", nameAr: "مستلزمات الشاي والقهوة", icon: "☕", description: "مستلزمات تحضير الشاي والقهوة" },
  { id: 6, name: "Bathroom & Waste", nameAr: "ادوات الحمام وسلة المهملات", icon: "🛁", description: "أدوات الحمام وسلال المهملات" },
  { id: 7, name: "Small Appliances", nameAr: "أجهزة كهربائية صغيرة", icon: "⚡", description: "الأجهزة الكهربائية الصغيرة" }
];

// Sample products from your database (will be replaced with real data if DB connects)
const sampleProducts = [
  { id: 213, productCode: "BYT58434125", name: "ساعة جدراية", nameAr: "ساعة جدراية", price: "50000.00", rating: "4.5", reviewCount: 12, categoryId: 3, featured: false, inStock: true },
  { id: 212, productCode: "BYT52892714", name: "سيت شكردان", nameAr: "سيت شكردان", price: "39000.00", rating: "4.3", reviewCount: 8, categoryId: 3, featured: false, inStock: true },
  { id: 211, productCode: "BYT50410163", name: "سيت شكردان", nameAr: "سيت شكردان", price: "39000.00", rating: "4.4", reviewCount: 15, categoryId: 3, featured: false, inStock: true },
  { id: 210, productCode: "BYT44092932", name: "سيت جدر خوص", nameAr: "سيت جدر خوص", price: "62000.00", rating: "4.6", reviewCount: 22, categoryId: 3, featured: false, inStock: true },
  { id: 89, productCode: "BYT89142734", name: "سيت طاوة ثلاثي", nameAr: "سيت طاوة ثلاثي", price: "45000.00", rating: "4.7", reviewCount: 34, categoryId: 4, featured: true, inStock: true },
  { id: 87, productCode: "BYT87298456", name: "طاوة كرانيت", nameAr: "طاوة كرانيت", price: "165000.00", rating: "4.8", reviewCount: 89, categoryId: 4, featured: true, inStock: true },
  { id: 172, productCode: "BYT87142418", name: "سيت جدر Ozlife", nameAr: "سيت جدر Ozlife ", price: "165000.00", rating: "4.9", reviewCount: 156, categoryId: 3, featured: true, inStock: true }
];

// In-memory cache for performance
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCacheKey(prefix, params = {}) {
  const paramStr = Object.keys(params).sort().map(k => `${k}:${params[k]}`).join('|');
  return `${prefix}:${paramStr}`;
}

function setCache(key, data, ttl = CACHE_TTL) {
  cache.set(key, {
    data,
    expiry: Date.now() + ttl
  });
}

function getCache(key) {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

// Database helper functions
async function fetchProductsFromDB(filters = {}) {
  if (!pool) return null;
  
  try {
    let query = 'SELECT * FROM products WHERE in_stock = true';
    const values = [];
    let paramCount = 1;
    
    if (filters.categoryId) {
      query += ` AND category_id = $${paramCount}`;
      values.push(filters.categoryId);
      paramCount++;
    }
    
    if (filters.featured !== undefined) {
      query += ` AND featured = $${paramCount}`;
      values.push(filters.featured);
      paramCount++;
    }
    
    if (filters.search) {
      query += ` AND (name ILIKE $${paramCount} OR name_ar ILIKE $${paramCount} OR product_code ILIKE $${paramCount})`;
      values.push(`%${filters.search}%`);
      paramCount++;
    }
    
    query += ' ORDER BY id DESC';
    
    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(parseInt(filters.limit));
      paramCount++;
    }
    
    const result = await Promise.race([
      pool.query(query, values),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 20000)
      )
    ]);
    
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    return null;
  }
}

// API Routes
app.get('/api/categories', async (req, res) => {
  try {
    const cacheKey = 'categories';
    const cachedData = getCache(cacheKey);
    
    if (cachedData) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }
    
    if (pool) {
      try {
        const result = await pool.query('SELECT * FROM categories ORDER BY id');
        const dbCategories = result.rows;
        setCache(cacheKey, dbCategories, 600000); // 10 minutes cache
        res.set('X-Cache', 'MISS-DB');
        return res.json(dbCategories);
      } catch (error) {
        console.log('Database categories failed, using fallback');
      }
    }
    
    setCache(cacheKey, categories, 300000); // 5 minutes cache for fallback
    res.set('X-Cache', 'MISS-FALLBACK');
    res.json(categories);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { categoryId, featured, search, limit = '50', offset = '0' } = req.query;
    
    const filters = {
      categoryId: categoryId ? parseInt(categoryId) : undefined,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
      search: search?.toString().trim() || undefined,
      limit: Math.min(parseInt(limit), 200), // Max 200 products
      offset: parseInt(offset) || 0
    };
    
    const cacheKey = getCacheKey('products', filters);
    const cachedData = getCache(cacheKey);
    
    if (cachedData) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedData);
    }
    
    // Try database first
    const dbProducts = await fetchProductsFromDB(filters);
    
    if (dbProducts && dbProducts.length > 0) {
      console.log(`تم تحميل ${dbProducts.length} منتج من قاعدة البيانات`);
      setCache(cacheKey, dbProducts, 60000); // 1 minute cache for DB data
      res.set('X-Cache', 'MISS-DB');
      res.set('X-Source', 'DATABASE');
      return res.json(dbProducts);
    }
    
    // Fallback to sample data
    let filteredProducts = [...sampleProducts];
    
    if (filters.categoryId) {
      filteredProducts = filteredProducts.filter(p => p.categoryId === filters.categoryId);
    }
    
    if (filters.featured !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.featured === filters.featured);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.nameAr.toLowerCase().includes(searchLower) ||
        p.productCode.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply pagination
    const startIndex = filters.offset;
    const endIndex = startIndex + filters.limit;
    filteredProducts = filteredProducts.slice(startIndex, endIndex);
    
    console.log(`استخدام البيانات التجريبية: ${filteredProducts.length} منتج`);
    setCache(cacheKey, filteredProducts, 120000); // 2 minutes cache for fallback
    res.set('X-Cache', 'MISS-FALLBACK');
    res.set('X-Source', 'SAMPLE');
    res.json(filteredProducts);
    
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, phone, address, province, products, total, paymentMethod } = req.body;
    
    if (!customerName || !phone || !products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'معلومات الطلب غير مكتملة' });
    }
    
    // Save to database if available
    if (pool) {
      try {
        const orderResult = await pool.query(
          'INSERT INTO orders (customer_name, customer_phone, customer_address, total_amount, shipping_cost, payment_method, session_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
          [customerName, phone, address || '', parseInt(total) || 0, 5000, paymentMethod || 'cash_on_delivery', 'web-order']
        );
        
        const orderId = orderResult.rows[0].id;
        
        // Insert order items
        for (const product of products) {
          await pool.query(
            'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
            [orderId, product.id, product.quantity, parseInt(product.price)]
          );
        }
        
        console.log(`طلب جديد محفوظ في قاعدة البيانات - رقم الطلب: ${orderId}`);
      } catch (dbError) {
        console.error('خطأ في حفظ الطلب:', dbError);
        // Continue with email notification even if DB save fails
      }
    }
    
    // Email notification
    const productsHtml = products.map(p => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 8px; font-family: Arial, sans-serif;">
          ${p.name || p.nameAr} (${p.productCode || 'غير متاح'})
        </td>
        <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${p.quantity}</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${parseInt(p.price || 0).toLocaleString()} د.ع</td>
        <td style="border: 1px solid #ddd; padding: 8px;">${parseInt((p.price || 0) * (p.quantity || 1)).toLocaleString()} د.ع</td>
      </tr>
    `).join('');
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'Lasker189@gmail.com',
      to: 'Lasker189@gmail.com',
      subject: `🛒 طلب جديد من مستلزمات بيوتنا - ${customerName}`,
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🏠 مستلزمات بيوتنا</h1>
            <h2 style="margin: 10px 0 0 0; font-size: 18px;">طلب جديد من العميل</h2>
          </div>
          
          <div style="background: white; padding: 20px; border: 1px solid #e5e5e5;">
            <h3 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 10px;">معلومات العميل</h3>
            <p><strong>الاسم:</strong> ${customerName}</p>
            <p><strong>رقم الهاتف:</strong> ${phone}</p>
            <p><strong>المحافظة:</strong> ${province || 'غير محدد'}</p>
            <p><strong>العنوان:</strong> ${address}</p>
            <p><strong>طريقة الدفع:</strong> ${paymentMethod === 'cash_on_delivery' ? 'الدفع عند الاستلام' : 'أونلاين'}</p>
            
            <h3 style="color: #0f766e; border-bottom: 2px solid #0f766e; padding-bottom: 10px; margin-top: 30px;">المنتجات المطلوبة</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
              <thead>
                <tr style="background: #f0fdf4;">
                  <th style="border: 1px solid #0f766e; padding: 10px; text-align: right;">المنتج</th>
                  <th style="border: 1px solid #0f766e; padding: 10px;">الكمية</th>
                  <th style="border: 1px solid #0f766e; padding: 10px;">السعر</th>
                  <th style="border: 1px solid #0f766e; padding: 10px;">المجموع</th>
                </tr>
              </thead>
              <tbody>
                ${productsHtml}
              </tbody>
            </table>
            
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ccfbf1 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #0f766e; margin: 0; font-size: 20px;">💰 المجموع الكلي: ${parseInt(total || 0).toLocaleString()} دينار عراقي</h3>
              <p style="margin: 5px 0 0 0; color: #059669;">شامل رسوم التوصيل</p>
            </div>
            
            <div style="background: #0f766e; color: white; padding: 15px; border-radius: 8px; text-align: center;">
              <p style="margin: 0;"><strong>للتواصل مع العميل:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 18px;">📱 ${phone}</p>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 15px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e5e5; border-top: none;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">مستلزمات بيوتنا - المتجر الأحدث في العراق</p>
          </div>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ طلب جديد من ${customerName} - المجموع: ${total} د.ع - تم إرسال الإشعار`);
    
    res.json({ 
      success: true, 
      message: 'تم إرسال طلبك بنجاح! سنتواصل معك خلال 24 ساعة.',
      orderId: Date.now() // Simple order ID for frontend
    });
    
  } catch (error) {
    console.error('خطأ في معالجة الطلب:', error);
    res.status(500).json({ 
      error: 'حدث خطأ في إرسال الطلب. يرجى المحاولة مرة أخرى أو التواصل معنا على 07707834399' 
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 مستلزمات بيوتنا - الخادم يعمل على المنفذ ${PORT}`);
  console.log(`📦 ${pool ? 'متصل بقاعدة البيانات PostgreSQL' : 'يعمل بالبيانات التجريبية'}`);
  console.log(`📧 خدمة البريد الإلكتروني جاهزة - ${process.env.EMAIL_USER || 'Lasker189@gmail.com'}`);
  console.log(`🌐 الموقع متاح على: http://localhost:${PORT}`);
});

export default app;
