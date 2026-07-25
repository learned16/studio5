# Data Model and Evolution

## Core entities

- UserProfile
- AcademicYear, Semester, Subject, SubjectProfile, CapabilityPack
- Lecture, Note, Capture, UnderstandingGap
- Task, ScheduleEntry, CalendarEvent
- FileArtifact, FileVersion, FileHash, ArtifactLink
- Notebook, InkDocument, InkStroke, InkLayer, Attempt
- Assignment, AssignmentRequirement, ProfessorFeedback
- Exercise, Skill, ErrorRecord, ProgressRecord
- BackupManifest, ExportManifest, SyncOperation

## قواعد البيانات

- UUID/ULID ثابت لكل كيان؛ لا تستخدم اسم المادة كمعرف.
- الروابط تتم عبر IDs وArtifactLinks، لا نسخ بيانات السياق داخل كل وحدة.
- لكل ملف أصلي hash ومصدر وحالة/نسخ؛ لا تستبدل الأصل بصمت.
- لكل Ink stroke ترتيب وزمن وضغط متاح وتنسيق versioned، مع preview مشتق قابل لإعادة البناء.
- يحتفظ Change Log بتاريخ القرارات والتغييرات التي تمس المستخدم.

## Schema v2 - Planning

- `ScheduleEntry`: `subjectId`, يوم أسبوعي ISO (الاثنين 1 إلى الأحد 7)، وقت بداية/نهاية محلي، وفترة سريان اختيارية.
- `Lecture`: `subjectId`, `scheduleEntryId?`, وقت بداية/نهاية، وحالة مخططة/مكتملة/ملغاة.
- `Task`: عامة أو مرتبطة بـ`subjectId` و`lectureId` متطابقين، مع موعد اختياري وأولوية وحالة.
- المحاضرة المرتبطة بموعد أسبوعي يجب أن تنتمي إلى المادة نفسها.
- المهمة المرتبطة بمحاضرة يجب أن تحمل مادة المحاضرة نفسها.
- تحديث المهمة يحفظ ID و`createdAt` ويغير `updatedAt`.
- أوقات `Lecture` و`Task.dueAt` تحتاج timezone صريحة (`Z` أو offset) حتى لا تختلف بين الأجهزة.

## Today query المشتق

- لا يضيف كياناً أو Collection ولا يغيّر Schema v2.
- يحسب حدود اليوم من تاريخ محلي و`utcOffsetMinutes` يقدمه العميل.
- Agenda تدمج Lecture الفعلية مع Schedule slots غير المغطاة من دون حفظ نسخة مشتقة.
- المهام تصنف إلى متأخرة، مستحقة اليوم، بلا موعد، ومكتملة اليوم.
- كل نتيجة تحتفظ بـStable IDs وسياق المادة المشتق للعرض، من دون نسخ السياق داخل التخزين.

## Schema v3 - Files and Artifacts

- `FileArtifact`: الهوية المنطقية للملف واسمه الأصلي واسم العرض ومصدر الإدخال.
- `FileHash`: SHA-256 فريد لكل محتوى؛ لا يعتمد على الاسم أو المسار.
- `FileVersion`: يرتبط بـArtifact وHash، ويحمل رقم النسخة والنوع والحجم ومفتاح التخزين.
- `ArtifactLink`: يربط Artifact حالياً بـSubject أوLecture أوTask عبر Stable IDs.
- المحتوى الفعلي يُخزن منفصلاً بعنوان `sha256/<digest>` ولا يدخل Snapshot.
- رفع bytes مطابقة يعيد Duplicate؛ إضافة Version متعمدة تحفظ السجل السابق.
- FileArtifact وFileHash وFileVersion وArtifactLink سجلات غير قابلة للاستبدال في هذه المرحلة.
- Migration v2 -> v3 تضيف Collections الجديدة فارغة وتحفظ Academic وPlanning وToday كما هي.

## Migrations

1. رقم schema محلي واضح.
2. Migration forward صغيرة وقابلة لإعادة التشغيل.
3. اختبار بيانات قديمة وبيانات ناقصة وفشل منتصف الترقية.
4. Backup قبل ترقية عالية الخطورة.
5. Rollback حيث أمكن، وإلا Recovery export/import موثق.

## التوسع

السنة الثانية تضيف Profiles/Packs/Entities جديدة بمهاجرات. لا تحذف أو تعيد ترميز بيانات السنة الأولى.
