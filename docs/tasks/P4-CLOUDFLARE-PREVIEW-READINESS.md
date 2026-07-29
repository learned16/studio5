# P4-PREVIEW-001 — Cloudflare Pages Preview Readiness

## الهدف

تجهيز Build الويب المتكامل لـPhase 4 لمعاينة Cloudflare Pages مرتبطة مباشرة بـGitHub، والتحقق آلياً من صلاحية الحزمة الساكنة قبل أي ربط بحساب Cloudflare أو أي نشر خارجي.

## Requirement IDs

- `S5-PREVIEW-001`
- `S5-PREVIEW-002`
- `S5-QA-P4-001`

## الفرع

`chore/cloudflare-preview-readiness`

## الملفات المسموح تعديلها

- `.node-version`
- `.github/workflows/ci.yml`
- `prototype/p3-lecture-capture-web/package.json`
- `prototype/p3-lecture-capture-web/scripts/typecheck.mjs`
- `prototype/p3-lecture-capture-web/scripts/verify-static-preview.mjs`
- `docs/PREVIEW_DEPLOYMENT_AR.md`
- `docs/tasks/P4-CLOUDFLARE-PREVIEW-READINESS.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`

## خارج النطاق

- تسجيل الدخول إلى Cloudflare أو ربط الحساب أو المستودع.
- إنشاء Pages project أو Preview خارجي أو Custom Domain أو Access policy.
- Wrangler وDirect Upload وChatGPT Sites.
- تعديل كود التطبيق أو Schema أو بيانات المستخدم.
- بدء Phase 5 أو الدمج إلى `develop` أو `main`.

## العقود التي لا يجوز تغييرها

- GitHub هو المصدر الوحيد للكود والتاريخ.
- `develop` هو Production branch المقترح مؤقتاً، وليس `main`.
- ناتج P3 الساكن هو `prototype/p3-lecture-capture-web/dist/assets`.
- كل Preview URL هو origin مستقل وIndexedDB لا ينتقل تلقائياً بين الروابط.
- بوابة MatePad تبقى منفصلة ولا يغلقها Build أو CI.

## معايير القبول

1. يوجد فحص قابل للتكرار يبني P3 ثم يتحقق من حزمة `dist/assets`.
2. المسارات `/` و`/closeout/` و`/library/` و`/reliability/` ترجع HTTP 200 من خادم ساكن محلي.
3. مسار غير موجود يرجع 404 ولا يوجد SPA fallback صامت.
4. PDF worker يُخدم من نفس origin وتنجح مراجع الأصول المحلية.
5. عقد تسجيل Service Worker على localhost موجود وملفه قابل للتحميل.
6. لا يوجد ملف أكبر من 25 MiB ولا أكثر من 20,000 ملف.
7. لا توجد ملفات أسرار أو ملفات محلية غير مقصودة داخل الناتج.
8. Core وP0 وP3 تنجح في lint وtypecheck وtest وbuild حسب scripts الحالية.
9. CI يشغّل فحص المعاينة من دون deploy أو secrets أو `continue-on-error`.
10. توثيق Dashboard يحدد GitHub و`develop` وNode 22 وpnpm 10 وBuild system V3 بدقة.

## دليل النجاح المتوقع

- مخرجات `preview:verify` تتضمن عدد الملفات، أكبر ملف، المسارات الناجحة، 404، PDF worker، Service Worker، والمراجع المكسورة.
- GitHub Actions: الوظائف الثلاث خضراء على Node.js 22.
- Pull Request واحد من هذا الفرع إلى `develop`.

## المخاطر

- نجاح CI لا يثبت سلوك PDF/IndexedDB/Backup على MatePad.
- كل Preview له origin وبيانات محلية مستقلة.
- تغيّر Cloudflare Dashboard أو حدود الخطة مستقبلاً يحتاج إعادة مراجعة الوثيقة.

## Rollback / Recovery

هذه المهمة لا تغيّر Schema أو بيانات المستخدم. يمكن التراجع بحذف script والفروع الوثائقية وإرجاع CI و`package.json` إلى حالتهما السابقة؛ Build التطبيق ومخازنه المحلية لا تتأثر.

## حالة التجربة

`Experimental / Readiness only`. لا تصبح المعاينة بيئة قبول قبل ربطها بـGitHub ونجاح بوابة MatePad.

## نتيجة التحقق المحلي

- Core: `100/100 PASS`.
- P0 Ink: `15/15 PASS` مع Build ناجح.
- P3: `22/22 PASS` مع lint وtypecheck وBuild ناجحة.
- Static Preview: `PASS`.
- الملفات: `249 / 20,000`.
- أكبر ملف: `vendor/pdfjs/pdf.worker.min.mjs` بحجم `1,304,896` bytes.
- المسارات: `/` و`/closeout/` و`/library/` و`/reliability/` كلها HTTP 200.
- المسار غير الموجود: HTTP 404، بلا SPA fallback.
- PDF worker: same-origin وHTTP 200.
- Service Worker: عقد التسجيل على localhost same-origin وملف `sw.js` يرجع HTTP 200.
- المراجع المحلية المكسورة: `0`.
- الملفات الحساسة/المسرّبة: `0`.

التحقق المحلي شُغّل بالـruntime المتاح في Codex (Node 24 / pnpm 11). GitHub Actions هو التحقق السلطوي
المطلوب لـNode 22 وpnpm 10، وحالته `PENDING` إلى أن يُرفع الفرع.
