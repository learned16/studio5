# P4-WORKERS-PREVIEW-001 — Workers Static Assets Preview Readiness

## الهدف

إعداد Studio5 لاستخدام `Cloudflare Workers Static Assets + Workers Builds` من مستودع GitHub،
مع فحص محلي وCI للإعداد والحزمة الساكنة من دون أي نشر فعلي.

## Requirement IDs

- `S5-PREVIEW-001`
- `S5-PREVIEW-002`
- `S5-PREVIEW-003`
- `S5-QA-P4-001`

## الفرع

`chore/workers-static-preview`

## الملفات المسموح تعديلها

- `.gitignore`
- `.github/workflows/ci.yml`
- `package.json`
- `pnpm-lock.yaml`
- `wrangler.jsonc`
- `docs/PREVIEW_DEPLOYMENT_AR.md`
- `docs/tasks/P4-WORKERS-STATIC-PREVIEW.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## خارج النطاق

- تسجيل الدخول إلى Cloudflare أو ربط المستودع من Dashboard.
- تنفيذ `wrangler deploy` أو `wrangler versions upload` من دون `--dry-run`.
- إضافة Worker script أو API أو bindings أو secrets أو tokens.
- Cloudflare Pages وChatGPT Sites.
- تعديل كود التطبيق أو Schema أو بيانات المستخدم.
- بدء Phase 5 أو تعديل `main` أو دمج Pull Request.

## العقود

- GitHub و`develop` هما مصدر Build الإنتاجي المقترح.
- Worker اسمه `studio5`.
- الناتج الساكن الوحيد هو `prototype/p3-lecture-capture-web/dist/assets`.
- `404.html` موجودة في جذر الناتج ويستخدمها `not_found_handling: 404-page`.
- المسارات ذات المجلدات تعتمد `index.html` فعلياً مع `auto-trailing-slash`.
- لا يوجد `main` أو Worker script؛ الطلبات تُخدم من Static Assets فقط.
- Wrangler مثبت بإصدار صريح داخل `package.json` والـlockfile.

## معايير القبول

1. `wrangler.jsonc` صالح ويحدد الاسم والتاريخ ومجلد الأصول وسياسة HTML و404 المطلوبة.
2. `dist/assets/404.html` موجودة بعد Build.
3. `pnpm run worker:config:check` ينجح باستخدام `wrangler deploy --dry-run` بلا نشر.
4. مخرجات Wrangler تثبت اكتشاف Static Assets وعدم وجود Worker script مخصص.
5. Core وP0 وP3 و`preview:verify` كلها ناجحة.
6. GitHub Actions يفحص إعداد Worker من دون token أو secret أو deploy.
7. وثيقة المعاينة تحدد إعداد Workers Builds المطلوب بدقة.

## Rollback / Recovery

لا يوجد تغيير Schema أو بيانات. يمكن التراجع بإزالة إعداد Wrangler وحزمة الجذر وخطوة CI وإرجاع
وثيقة المعاينة؛ ملفات المستخدم وIndexedDB وPDF وInk لا تتأثر.

## الحالة

`LOCAL PASS / PR CI PENDING / SETUP ONLY / NOT DEPLOYED`.

التحقق المحلي:

- Studio5 Core: `100/100`.
- P0 Ink Web: `15/15` وBuild ناجح.
- P3 Lecture Capture Web: `22/22`.
- Static Preview: `PASS`، وعدد الملفات `250`، والمسار المجهول يرجع `404.html`.
- Wrangler: الإصدار `4.114.0`، وأمر `wrangler deploy --dry-run` نجح وقرأ مجلد
  `prototype/p3-lecture-capture-web/dist/assets` من دون تنفيذ نشر.
