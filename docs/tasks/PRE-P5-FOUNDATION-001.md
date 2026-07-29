# PRE-P5-FOUNDATION-001 — تنظيم ما قبل المرحلة الخامسة

## الهدف

تثبيت نقطة تجميع `develop` من أحدث نسخة متكاملة ومختبرة للمراحل 1–4، وتنظيم
الفروع والتوثيق والمعاينة المستقبلية ومواصفات المرحلتين 5 و6، من دون إعادة تنفيذ
إصلاحات المرحلة الرابعة أو بدء برمجة Drawing Coach.

## Requirement IDs

- `S5-QA-P4-001`
- `S5-GIT-001`
- `S5-PREVIEW-001`
- `S5-NATIVE-001`
- `S5-DC-SPEC-001`
- `S5-P6-SPEC-001`

## نقطة البداية

- النسخة المتكاملة: `codex/p4-hardening-review` عند `2f5196c`.
- فرع التجميع المنشأ منها: `develop`.
- فرع العمل: `chore/pre-phase5-foundation`.

## الملفات المسموحة

- `.github/workflows/ci.yml`
- `AR_HERE_START.md`
- `PROJECT_STATUS.md`
- `docs/TRACEABILITY.md`
- `docs/DECISION_LOG.md`
- `docs/BRANCH_AUDIT.md`
- `docs/GIT_WORKFLOW_AR.md`
- `docs/tasks/P4-MATEPAD-CLOSURE-CHECKLIST.md`
- `docs/PREVIEW_DEPLOYMENT_AR.md`
- `docs/NATIVE_READINESS_AR.md`
- `docs/PHASE_5_DRAWING_COACH_SPEC_AR.md`
- `docs/PHASE_6_FINAL_INTEGRATION_SPEC_AR.md`
- هذا الملف.

نُقل محتوى `docs/WEB_BUILD.md` إلى وثيقة المعاينة الأشمل وحُذف الاسم القديم بعد
تحديث مراجعه؛ لا توجد وثيقتان للغرض نفسه.

## خارج النطاق

- إعادة كتابة إصلاح Portable Backup أو اختبارات Schema 7→8 المنجزة.
- إعادة تشغيل الاختبارات المحلية الكاملة التي نجحت في `P4-HARD-001` بلا تغير كود.
- برمجة Drawing Coach أو أي جزء من Phase 5.
- إنشاء فرعي Phase 5 أو Phase 6.
- الدمج في `main` أو تغيير default branch.
- حذف أي branch أو إنشاء Tag.
- نشر Sites أو Preview خارجي.
- إضافة Capacitor أو Tauri أو Flutter.

## معايير القبول

1. `develop` يشير إلى النسخة المتكاملة `2f5196c` أو أحدث منها دون إعادة كتابة تاريخ.
2. CI يستهدف `develop` و`main` عند push وPull Request، ويمنع التشغيلات القديمة
   المتزامنة للفرع نفسه.
3. جميع remote branches موثقة مع علاقتها بـ`develop` وتوصية غير تنفيذية.
4. سياسة Git العربية تشرح دورة العمل للمبتدئ.
5. بوابة MatePad تغطي PDF وInk وBackup/Restore وعدم التكرار والفشل الآمن.
6. توثيق المعاينة مبني على GitHub والـbuild الحقيقي فقط، بلا نشر فعلي.
7. توثيق Native يحدد حدود Core وAdapters من دون refactor واسع.
8. مواصفتا Phase 5 و6 جاهزتان للمراجعة ولا تحتويان كود تنفيذ.
9. لا توجد ملفات توثيق مكررة تحقق الغرض نفسه.
10. `main` وSites وباقي الفروع لم تتغير.

## التحقق

- مراجعة `git diff --check`.
- فحص YAML الخاص بـCI ووجود triggers/concurrency/permissions المطلوبة.
- فحص الروابط والمسارات المذكورة في الوثائق.
- لا يلزم إعادة Build أو Tests الكاملة لأن هذه المهمة لا تعدل كود التطبيق؛ نعتمد
  نتائج `P4-HARD-001` وGitHub Actions `3/3 PASS` ما لم يتغير ملف تنفيذي.

## المخاطر

- بعض الفروع القديمة تحتوي commits غير موجودة حرفياً في `develop` لكنها نُسخت أو
  استُبدلت وظيفياً؛ يجب تصنيفها للمراجعة لا دمجها آلياً.
- فرع `main` يحتوي تاريخ توثيق منفصلاً؛ لا يجوز استخدامه قاعدة للمرحلة الخامسة.
- Preview static يحتاج تدقيق root/base path وService Worker قبل ربط مزود خارجي.

## Rollback / Recovery

- حذف فرع العمل محلياً/بعيداً لاحقاً يعيد الحالة إلى `develop` من دون فقد بيانات.
- تحديثات CI والوثائق قابلة للإرجاع بCommit عكسي.
- لا توجد Migration أو كتابة لبيانات المستخدم في هذه المهمة.

## نتيجة التحقق المحلي

- `DOC_FILES 9/9 PASS`.
- `CI_POLICY 7/7 PASS`.
- `git diff --check`: PASS.
- `NO_APP_CODE_CHANGES`: PASS.
- `NO_DUPLICATE_WEB_BUILD`: PASS.
- اختبارات التطبيق لم تُكرر محلياً لأن هذه المهمة لا تغير `packages/**` أو
  `prototype/**`.

## نتيجة GitHub

- الفرع مرفوع عند Commit `65f3140`.
- Pull Request: `https://github.com/learned16/studio5/pull/2`.
- الهدف هو `develop`، وليس `main`.
- GitHub Actions: `3/3 PASS`:
  - Studio5 Core.
  - P0 Ink Web.
  - P3 Lecture Capture Web.
- المهمة جاهزة لمراجعة المستخدم، لكن لا تُدمج آلياً.
- Phase 4 تبقى بانتظار Preview مبني من GitHub وبوابة MatePad، ولا تبدأ Phase 5.
