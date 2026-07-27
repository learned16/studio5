# Risk Register

| الخطر | الأثر | التخفيف | بوابة القرار |
|---|---|---|---|
| Scope explosion | تأخير وفشل الاعتمادية | Scope Freeze وBacklog وChange Control | كل milestone |
| تراجع أداء Stack بعد نجاح Prototype | تجربة رسم سيئة عند توسع PDF/Notebook | Gate 0 ناجح + حدود Ink مستقلة + Hardening ومحفزات ADR-008 | عند كل Demo وHardening |
| فقد بيانات Ink | خسارة عمل الطالب | Autosave + journal + crash drills + export | P0 وHardening |
| Core مثبت على مواد سنة أولى | إعادة بناء لاحقة | IDs + Profiles + Packs + migrations | مراجعة معمارية |
| AI dependency | تعطيل الدراسة وكلفة | Local flows أولاً وProvider abstraction وحدود إنفاق لاحقة | قبل AI |
| ملفات أصلية مستبدلة | فقدان مرجع أو نسخة | Immutable originals + versions + hash | File intake |
| مزامنة غير موثوقة | تعارض/فقد | Local-first وحالة واضحة واحتفاظ بنسختين للرسم المعقد | Phase 4 |
| استعادة Ink قديمة تمحو المسودة الحالية | فقد تعديل حديث رغم نجاح Gate 0 | حفظ المسودة الحالية كRevision قبل الاستعادة + بوابة MatePad مستقلة لـP2-GATE-001/002 | قبل Phase 3 |
| واجهة مزدحمة | التطبيق يستهلك وقت الدراسة | progressive disclosure وتجربة المستخدم | كل demo |
| ادعاء تقييم رسم مبالغ | ثقة زائفة | قياسات صادقة فقط وشرح الحدود | Drawing Coach |
