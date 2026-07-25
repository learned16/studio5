# Architecture Decisions

## ADR-001: Modular Monolith

**قرار:** يبدأ التطبيق Modular Monolith، لا Microservices.  
**السبب:** مستخدم واحد ونافذة تنفيذ ثلاثة أشهر.  
**الحدود:** Core، Academic، Files/Artifacts، Notes/Ink، Tasks/Schedule، Search، Sync/Backup، Drawing Coach، AI Adapter.  
**الأثر:** وحدات داخل تطبيق واحد مع واجهات واضحة بين Domains.

## ADR-002: Local-first

قاعدة بيانات محلية هي مصدر العمل اليومي. السحابة/المزامنة/AI حدود فشل منفصلة. لا يعامل التخزين المحلي كـcache هش.

## ADR-003: Stable IDs وSchemas

كل كيان يملك Stable ID لا يتغير. كل schema تحمل إصداراً، وكل تعديل يملك Migration مختبرة وRollback أو Recovery موثقاً.

## ADR-004: Subject Profiles وCapability Packs

Subject لا ينشئ شاشات خاصة باسم مادة. Profile يحدد نوع المادة، وCapability Packs تفعل الأدوات مثل exercises أو problem notebook أو materials cards. لا تثبت مواد السنة الأولى في Core.

## ADR-005: ملفات وأحبار غير متلفة

الأصل PDF/الملف Immutable. annotations وink وpreviews وderived artifacts منفصلة، مع hash وversion record ومصدر.

## ADR-006: Feature Flags

كل قدرة اختيارية أو مستقبلية خلف Feature Flag. لا تستخدم Flags لإخفاء Must Have من دون Change Control.

## ADR-007: AI Provider Abstraction

واجهة Provider مستقلة عن OpenAI أو Claude. لا يوضع مفتاح API في العميل. AI اختياري؛ سلاسل الدراسة المحلية لا تعتمد عليه.

## ADR-008: اختيار التقنية مؤجل ومقيد

لا يعتمد Stack نهائياً قبل Prototype MatePad للقلم والحفظ والاستعادة والتصدير. القرار يقارن Web/PWA وNative wrapper وCross-platform وفق قياسات فعلية، لا تفضيل نظري.

## ADR-009: واجهات تجريبية قابلة للاستبدال

**قرار:** كل واجهة أو تدفق يُبنى قبل الاستعمال الجامعي الحقيقي يبقى `Experimental`، وتفصل ملفاته عن Core وعن بقية واجهات التجارب.

**السبب:** المتطلبات الحالية مبنية على توقعات قبل بدء الدوام. قد يثبت الاستخدام الحقيقي أن شكلاً ما ضعيف أو غير مفيد أو يحتاج إعادة تصميم جوهرية.

**الحدود المعمارية:**

1. `Core/Domain`: المعنى والبيانات والعقود المستقرة.
2. `Adapter/Bridge`: ترجمة العقد إلى احتياج السطح.
3. `Prototype UI`: تجربة قابلة لإعادة البناء.
4. `Deployment`: إعداد نشر مستقل للسطح عند الحاجة.

لا يستورد Prototype ملفات Prototype آخر مباشرة، ولا يُنقل منطق المجال إلى UI لتسريع التجربة.

**الأثر:** يمكن تعديل أو استبدال أو تقاعد واجهة Capture أو Ink أو أي تجربة لاحقة من دون هدم بقية النظام. تبقى البيانات محفوظة، وأي تغيير Schema يمر عبر Migration وRecovery.

**حالات النضج:** `Experimental -> Accepted | Revise | Retired`. النجاح التقني وحده لا ينقل الميزة إلى `Accepted`؛ يحتاج استعمالاً حقيقياً وقرار مستخدم.
