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

## Migrations

1. رقم schema محلي واضح.
2. Migration forward صغيرة وقابلة لإعادة التشغيل.
3. اختبار بيانات قديمة وبيانات ناقصة وفشل منتصف الترقية.
4. Backup قبل ترقية عالية الخطورة.
5. Rollback حيث أمكن، وإلا Recovery export/import موثق.

## التوسع

السنة الثانية تضيف Profiles/Packs/Entities جديدة بمهاجرات. لا تحذف أو تعيد ترميز بيانات السنة الأولى.
