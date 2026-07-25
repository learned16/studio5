# DOCS-SOP-001 - Collaboration SOP Integration

## الهدف

دمج المحتوى المفيد من `Studio5_SOP.pdf` و`files.zip` في وثائق المستودع الحالية من دون إدخال وثائق قديمة
كمرجع أعلى، ومن دون تغيير نطاق السنة الأولى أو كود التطبيق.

## الملفات المسموحة

- `AR_HERE_START.md`
- `CLAUDE.md`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `README.md`
- `PROJECT_STATUS.md`
- `AGENTS.md`
- `docs/STUDIO5_SOP.md`
- `docs/reference/README.md`
- `docs/reference/STUDIO5_SOP_v1.pdf`
- `docs/TRACEABILITY.md`
- `docs/LONG_TERM_EXPANSION.md`
- `docs/DECISION_LOG.md`
- `docs/ACCEPTANCE_TESTS.md`
- `docs/IMPLEMENTATION_ROADMAP.md`
- `docs/tasks/DOCS-SOP-001.md`
- `files.zip` (إزالة النسخة المضغوطة بعد دمج المحتوى المفيد)

## خارج النطاق

- أي كود تطبيق أو Core أو Prototype.
- تغيير المرجع السلطوي.
- إلغاء أو تأجيل Project Lite أو الدرجات أو Understanding Rescue أو ملاحظات الدكتور.
- فرض أدوات أو Dependencies خارجية غير متحققة.
- تغيير حالة مهام P2 السابقة.

## قواعد الدمج

- المرجع السلطوي ثم أحدث قرار مستخدم صريح يتقدمان على الحزمة الواردة.
- لا تُنسخ وثيقة قديمة فوق وثيقة حالية.
- لا تبقى نسخة مضغوطة داخل المستودع.
- لا تُنشأ وثيقتان تؤديان الوظيفة نفسها.
- يحتفظ `PROJECT_STATUS.md` بالحالة التشغيلية الفعلية.

## معايير القبول

- توجد نقطة بداية واحدة واضحة لأي وكيل.
- توجد SOP تشغيلية بصيغة Markdown قابلة للمراجعة والتعديل.
- توجد تعليمات مراجعة مستقلة وقالب Pull Request.
- توجد مصفوفة تتبع تربط المنجز والقادم بالمهام الفعلية.
- توثّق القرارات الأحدث التي تجاوزت قيود Gate 0 القديمة.
- لا توجد مراجع مكسورة إلى ملفات غير موجودة.
- لا يبقى `files.zip`.
- لا يتغير كود التطبيق.

## Rollback

حذف الملفات الجديدة وإعادة التعديلات الوثائقية لهذه الدفعة فقط. لا توجد Migration أو بيانات مستخدم متأثرة.

## Evidence

- `git diff --check`: ناجح.
- Core lint/type contract/tests: ناجحة، `19/19`.
- P0 build/lint/type contract/tests: ناجحة، `12/12`.
- فحص `files.zip`: أُزيل من مساحة العمل بعد دمج المحتوى المفيد.
- لا توجد تغييرات داخل `packages/` أو `prototype/`.
- الرفع إلى GitHub: بانتظار Commit وPush.
