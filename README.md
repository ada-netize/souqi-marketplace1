# سوقي — نسخة إطلاق نظيفة وجاهزة للتشغيل

هذه النسخة من **سوقي** مهيأة لتكون قاعدة إطلاق حقيقية للمشروع، وليست نسخة عرض مليئة بأمثلة أو مستخدمين تجريبيين.

## الفكرة النهائية المثبتة
- حساب واحد فقط: **مستخدم عادي**
- نفس الحساب يستطيع:
  - نشر إعلان مجاني
  - تفعيل رفع الإعلان
  - شراء Boost
  - شراء Featured
  - الاشتراك بباقة متجر
- لا يوجد دفع للسلعة نفسها داخل التطبيق أو الموقع
- الاتفاق والبيع يتمان مباشرة بين المستخدمين عبر الهاتف أو واتساب أو الرسائل

## مكونات المشروع
- `backend-api` — API بـ Node.js + Express + SQLite
- `admin-dashboard` — لوحة الأدمن + الموقع العام بـ Next.js
- `mobile-app` — تطبيق Expo / React Native

## أهم ما تم تثبيته
- ربط التطبيق والموقع ولوحة الأدمن على **نفس قاعدة البيانات ونفس الـ API**
- أي تعديل على:
  - المستخدمين
  - الإعلانات
  - الأقسام
  - المدن
  - الأسعار
  - الباقات
  - الإعدادات العامة
  ينعكس على التطبيق والموقع
- تفعيل الحظر الفعلي للمستخدم:
  - يمنع تسجيل الدخول
  - يمنع استخدام الجلسة القديمة
  - يخفي إعلانات الحساب المحظور من الواجهة العامة
- تفعيل توثيق المستخدم والاشتراكات من لوحة الأدمن مع انعكاسها على التطبيق
- إبقاء الربح على المنتجات الرقمية فقط:
  - Raise
  - Boost
  - Featured
  - Store subscriptions
- تنظيف النسخة من البيانات التجريبية

## قاعدة البيانات بعد الـ seed
بعد تشغيل `npm run seed` تصبح القاعدة:
- فيها **أدمن جاهز**
- فيها الأقسام والمدن والإعدادات الأساسية
- **بدون مستخدمين تجريبيين**
- **بدون إعلانات تجريبية**
- **بدون رسائل أو عروض أو بلاغات تجريبية**

هذا يعني أن أول مستخدم حقيقي يتم إنشاؤه من التطبيق أو من API التسجيل.

## بيانات دخول الأدمن
- البريد: `admin@example.com`
- كلمة المرور: `12345678`

## أول تشغيل
من جذر المشروع:

```bash
npm install --ignore-scripts
npm run install:mobile
npm run seed
```

ثم:

```bash
npm run dev:api
npm run dev:admin
```

ولتشغيل الموبايل:

```bash
cd mobile-app
npx expo start --clear
```

## الروابط
- API: `http://localhost:5000`
- Admin: `http://localhost:3000`
- Web: `http://localhost:3000/market`

## ملاحظات الإشعارات
- تم تجهيز التطبيق لإشعارات الرسائل عبر `expo-notifications` + Expo Push Service
- بعد بناء التطبيق على جهاز حقيقي، ضع `EXPO_PUBLIC_EAS_PROJECT_ID` داخل `.env` أو داخل `app.json`
- التطبيق يسجل Expo push token للمستخدم تلقائيًا بعد تسجيل الدخول
- الباكند يرسل إشعارًا عند وصول رسالة جديدة

## إعداد Expo على جهاز حقيقي
أنشئ ملف `.env` داخل `mobile-app` اعتمادًا على `.env.example` ثم ضع IP جهازك:

```env
EXPO_PUBLIC_API_URL=http://YOUR-LAN-IP:5000
```

## منتجات IAP الحالية
### Apple App Store
- `souqi_raise_1_day`
- `souqi_raise_3_days`
- `souqi_boost_3_days`
- `souqi_featured_3_days`
- `souqi_store_basic_monthly`
- `souqi_store_plus_monthly`
- `souqi_store_pro_monthly`

### Google Play
- `souqi_raise_1_day`
- `souqi_raise_3_days`
- `souqi_boost_3_days`
- `souqi_featured_3_days`
- `souqi_store_basic_monthly`
- `souqi_store_plus_monthly`
- `souqi_store_pro_monthly`

## ما بقي فقط قبل النشر على المتاجر
- ربط المنتجات الحقيقية داخل App Store Connect
- ربط المنتجات الحقيقية داخل Google Play Console
- إضافة بيانات المتجر النهائية (الدعم، الخصوصية، الشروط، الدومين إن وجد)
- بناء نسخ الإنتاج النهائية للتطبيق

## ملفات مهمة داخل المشروع
- `FINAL-SETUP.txt`
- `IAP-SETUP.txt`
- `DELIVERED-FIXES.txt`
- `start-project.bat`
"# souqi-marketplace1" 
"# souqi-marketplace2" 
