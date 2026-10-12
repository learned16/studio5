# نشر Studio5 على حسابك الشخصي في Cloudflare

التطبيق ملفات ثابتة داخل `studio5-app/public` (صفحة + Service Worker + أيقونات).
Cloudflare لا يخزن أي بيانات؛ بياناتك تبقى في جهازك (ومع Backup).

## الطريقة الأسهل (بدون توكن): ربط GitHub من لوحة Cloudflare

1. ادخل بحسابك الشخصي على dash.cloudflare.com (تأكد من اسم الحساب أعلى اليسار، مو حساب الشركة).
2. Workers & Pages ← Create ← Import a repository ← اختر `learned16/studio5`.
3. الإعدادات:
   - Production branch: الفرع اللي بيه التطبيق (حالياً `claude/zen-bell-oqcqtr`).
   - Root directory: `studio5-app`
   - Build command: `node build.mjs`
   - Deploy command: `npx wrangler deploy`
4. Deploy. يطلع لك رابط مثل `https://studio5-app.<اسمك>.workers.dev`.
   كل Push جديد ينشر تلقائياً.

## التنصيب على اللابتوب

افتح الرابط بـ Chrome أو Edge ← أيقونة التنصيب بشريط العنوان (أو القائمة ← Install Studio5).
يصير برنامج بنافذة وأيقونة خاصة ويشتغل بدون إنترنت.

## ملاحظات

- نسخة Cloudflare تحفظ على الجهاز نفسه فقط. لنقل البيانات بين الأجهزة: System ← Backup ← Restore.
- الذكاء الاصطناعي والمزامنة السحابية متوفرة بنسخة claude.ai فقط.

## التحقق بعد النشر

- افتح `https://studio5-app.<اسمك>.workers.dev` ← System ← Health: لازم يظهر «Install on this computer».
- إذا البناء ما بدأ: Workers & Pages ← studio5-app ← Settings ← Build ← تأكد أن Production branch هو `claude/zen-bell-oqcqtr` و Root directory هو `studio5-app`.
