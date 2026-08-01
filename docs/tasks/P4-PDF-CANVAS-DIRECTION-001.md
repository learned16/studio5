# P4-PDF-CANVAS-DIRECTION-001 — PDF.js Canvas Direction

## الهدف

منع عارض PDF.js من وراثة اتجاه RTL من واجهة Library التجريبية، وذلك بتثبيت اتجاه عنصر Canvas وسياق Canvas ثنائي الأبعاد على LTR من دون تغيير اتجاه الواجهة أو محتوى HTML.

## Requirement IDs

- `S5-UX-PDF-CANVAS-001`

## الفرع

- `fix/pdfjs-canvas-direction`
- Base: أحدث `develop`

## Root cause المثبت

- صفحة Library القديمة تستخدم RTL.
- عنصر `#pdf-canvas` كان يرث `direction: rtl`.
- PDF.js يرسم النص داخل Canvas؛ اتجاه RTL الموروث يضر مواضع الحروف العربية والإنكليزية.
- تغيير `canvas.width` أو `canvas.height` يعيد حالة Canvas 2D، لذلك يجب ضبط `context.direction = "ltr"` بعد الأبعاد وقبل `page.render`.
- PDF worker وCMaps وstandard fonts وWASM وICC تعمل، والخطوط العربية مضمّنة داخل ملفات الاختبار؛ لا حاجة إلى تغيير PDF.js أو الخطوط.

## الملفات المسموح تعديلها

- `prototype/p3-lecture-capture-web/library/styles.css`
- `prototype/p3-lecture-capture-web/library/pdf-viewer.mjs`
- `prototype/p3-lecture-capture-web/tests/pdf-viewer-ui.test.mjs`
- هذا الملف

## خارج النطاق

- PR #6 وbranch `fix/arabic-content-rendering`.
- Core وSchema وStorage وBackup وMigrations.
- تغيير Product Shell أو اتجاه HTML أو تصميم P3.
- ترقية `pdfjs-dist` أو تغيير `useSystemFonts` أو استخدام `disableFontFace`.
- خطوط خارجية أو Arabic reshaping.
- Phase 5.

## معايير القبول

1. `#pdf-canvas` يملك `direction: ltr` صريحة.
2. `context.direction = "ltr"` يُضبط بعد `canvas.width` و`canvas.height` وقبل `page.render`.
3. تبقى نسخة PDF.js المثبتة ومسارات worker وCMaps وstandard fonts وWASM وICC بلا تغيير.
4. تبقى عقود Previous/Next وZoom وFit Width موجودة وتنجح Regression tests.
5. تنجح Build وStatic Preview وWrangler dry-run.
6. لا يُسجل نجاح بصري للعربية داخل PDF Canvas قبل اختبار PDF عربي حقيقي على MatePad.

## الاختبارات المطلوبة

- Core: lint/typecheck/test.
- P0 Ink: lint/typecheck/test/build.
- P3: lint/typecheck/test.
- PDF viewer regressions.
- `preview:verify`.
- Wrangler deploy dry-run.
- GitHub Actions وCloudflare Preview بعد Push.

## الحالة

- Automated regression: `PASS`.
- PDF viewer regression: `4/4 PASS`.
- P3 regression: `24/24 PASS`.
- Core regression: `100/100 PASS`.
- P0 Ink regression: `15/15 PASS` مع Build ناجح.
- Static Preview: `PASS`؛ أربعة مسارات 200، والمسار المجهول 404، ولا مراجع محلية مكسورة أو ملفات حساسة.
- Wrangler `4.114.0` dry-run: `PASS`؛ قرأ 261 ملفاً ولم ينفذ نشراً.
- Arabic PDF visual rendering on MatePad: `PENDING`.
- PR #6 منفصل ويخص HTML user content؛ لا يتغير ضمن هذه المهمة.

## Rollback / Recovery

التراجع يقتصر على إزالة قاعدتي اتجاه Canvas والاختبارات المرتبطة. لا توجد تغييرات بيانات أو Migration أو أصول مستخدم.
