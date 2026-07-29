# المعاينة والبناء المستقل المرتبطان بـGitHub

## القرار

- مستودع GitHub وفروعه هما المصدر الوحيد للكود والتاريخ.
- ChatGPT Sites متوقف؛ النسخة القديمة تبقى مرجعاً مجمداً ولا تُستخدم للاختبار
  أو القبول ولا تستقبل أي تحديث.
- الخيار الحالي هو `Cloudflare Workers Static Assets + Workers Builds`، وليس Cloudflare Pages.
- لا يوجد نشر خارجي ضمن هذه المهمة.
- أي Preview لاحق يجب أن يبني commit موجوداً في GitHub مباشرة، لا نسخة منسوخة
  يدوياً ولا branch مخصصاً لمزود الاستضافة.

## النسخة المتكاملة التي تُعاين

الحزمة الأقرب إلى تطبيق السنة الأولى المتكامل حالياً هي:

```text
prototype/p3-lecture-capture-web
```

وتحتوي Capture وCloseout وLibrary وPDF.js وReliability، وتستخدم Studio5 Core
المشترك. يبقى P0 Ink مختبراً مستقلاً للقلم، وليس مدخل المعاينة المتكاملة.

## متطلبات البناء

- Node.js 22.
- pnpm 10.
- ملف الجذر `.node-version` يثبت Node على الإصدار `22`.
- P3 يستخدم `pnpm-lock.yaml` الملتزم في Git؛ يجب استخدام
  `pnpm install --frozen-lockfile`.
- لا توجد متغيرات بيئة أو أسرار مطلوبة للبناء الحالي.

## أوامر البناء

### Studio5 Core

Core مكتبة JavaScript وليس لها build ويب مستقل:

```text
cd packages/studio5-core
npm run lint
npm run typecheck
npm test
```

### P0 Ink Web

```text
cd prototype/p0-ink-web
npm run build
```

الناتج:

```text
prototype/p0-ink-web/dist/
```

الأصول الثابتة داخل `dist/assets/`، ويوجد مدخل خادم اختياري داخل
`dist/server/index.js`.

### P3 المتكامل

```text
cd prototype/p3-lecture-capture-web
pnpm install --frozen-lockfile
pnpm run preview:verify
```

الناتج:

```text
prototype/p3-lecture-capture-web/dist/
```

مجلد النشر الثابت:

```text
prototype/p3-lecture-capture-web/dist/assets/
```

أما `dist/server/index.js` فهو مدخل اختياري ولا تحتاجه الاستضافة الثابتة الحالية.

`preview:verify` يبني الحزمة ثم يفحصها بخادم HTTP ساكن محلي. يتحقق من المسارات الفعلية، ووجود
`404.html` في جذر Build output وإرجاعها مع HTTP 404 لأي مسار مجهول بدلاً من الصفحة الرئيسية،
وPDF worker وService Worker من نفس origin، والمراجع المحلية، وحد 25 MiB للملف الواحد،
وحد 20,000 ملف لخطة Workers Free، وعدم تسرب ملفات محلية أو أسرار معروفة.

## إعداد Cloudflare Workers Builds الدقيق عند الربط لاحقاً

هذه القيم تُدخل يدوياً في Cloudflare Dashboard بعد موافقة المستخدم. هذه المهمة لا تنشئ المشروع ولا تسجل
الدخول ولا تربط GitHub:

| الحقل | القيمة |
|---|---|
| Product | Workers & Pages → Create application → Import a repository |
| Repository | `learned16/studio5` |
| Production branch | `develop` |
| Root directory | جذر المستودع `/` |
| Build command | `cd prototype/p3-lecture-capture-web && pnpm install --frozen-lockfile && pnpm run build` |
| Production deploy command | `npx wrangler deploy` |
| Non-production deploy command | `npx wrangler versions upload` |
| Builds for non-production branches | Enabled |
| Environment variable | `NODE_VERSION=22` |
| Environment variable | `PNPM_VERSION=10` |

### لماذا هذه القيم؟

- `GitHub`: حتى يبني Cloudflare الـcommit/SHA الموجود فعلياً في المستودع، لا نسخة منسوخة يدوياً.
- `develop`: هو فرع التجميع الحالي؛ `main` لا يُستخدم لنشر هذه المعاينة.
- جذر المستودع: أمر البناء يعتمد على مسارات `packages/studio5-core` و`prototype/` معاً.
- `pnpm run build`: ينشئ `dist/assets` ويتحقق من المداخل و`404.html` قبل أمر Wrangler.
- `wrangler deploy`: يرفع إصدار فرع `develop` ويرقّيه إلى Production عند تفعيل الربط لاحقاً.
- `wrangler versions upload`: يرفع إصدار معاينة للفروع غير الإنتاجية من دون ترقيته إلى Production.
- Wrangler مثبت في `package.json` بإصدار صريح، لذلك `npx` داخل Workers Builds يستخدم النسخة المحلية.
- Node 22 وpnpm 10 يمنعان اختلاف بيئة Workers Builds عن CI والـlockfile.

لا نستخدم في الإعداد الحالي:

- `main` كـProduction branch.
- Cloudflare Pages أو Direct Upload.
- Custom Domain.
- Cloudflare Access.
- Functions أو أسرار أو API tokens.
- ChatGPT Sites.

كل رابط Preview وbranch alias وProduction URL هو origin متصفح مستقل. لذلك IndexedDB وCache Storage
وService Worker وبيانات PDF/Notes/Ink المخزنة محلياً لا تنتقل تلقائياً بين الروابط. يجب إجراء بوابة MatePad
على رابط واحد محدد وتسجيل SHA والرابط في تقرير الاختبار.

## تدقيق الاستضافة الثابتة

| العنصر | الحالة الحالية |
|---|---|
| Static Assets | `wrangler.jsonc` يخدم `prototype/p3-lecture-capture-web/dist/assets` مباشرة بلا Worker script |
| SPA fallback | غير مستخدم؛ `not_found_handling: 404-page` يعيد أقرب `404.html` مع HTTP 404 |
| المسارات المعروفة | `/` و`closeout/` و`library/` و`reliability/` تعتمد ملفات `index.html` حقيقية |
| المسارات المجهولة | يجب أن ترجع محتوى `404.html` مع HTTP 404، لا الصفحة الرئيسية |
| HTML handling | `auto-trailing-slash` لخدمة ملفات `index.html` داخل المجلدات بصيغة URL الطبيعية |
| Base path | الأصول وروابط PWA نسبية؛ يفضل النشر على جذر domain/preview لا داخل subpath ثابت |
| Service Worker | موجود، ويجب أن يُخدم عبر HTTPS وبـscope جذر المعاينة |
| IndexedDB | يعمل من static hosting؛ البيانات محلية لكل origin ولا تنتقل بين روابط Preview المختلفة |
| PDF worker | موجود داخل `assets/vendor/pdfjs/` ويعمل من نفس origin |
| Environment variables | لا توجد حالياً |
| Absolute paths | لم يُعثر على اعتماد لازم لمسار domain مطلق؛ يجب إعادة smoke test بعد اختيار المزود |
| البيانات بين previews | كل Preview له origin مختلف غالباً، لذلك بيانات IndexedDB لا تُشارك تلقائياً |

## مقارنة خيارات المعاينة

| الخيار | PR Preview | رابط branch ثابت | ملاءمة الحالة الحالية | الملاحظة |
|---|---|---|---|---|
| Cloudflare Workers Static Assets + Workers Builds | نعم، عبر Versions | نعم | المعتمد حالياً | Git integration مباشر، أصول ساكنة بلا Worker script، ونسخة Wrangler مثبتة |
| Vercel | نعم | نعم | مناسب | يمكنه نشر static output، لكنه أوسع من حاجة المشروع الحالية |
| GitHub Pages | ليس افتراضياً لكل PR | فرع/بيئة واحدة غالباً | أضعف | يحتاج workflow إضافياً وإدارة base path للـrepository subpath |

## التوصية

التوصية عند موافقة المستخدم لاحقاً هي **Cloudflare Workers Static Assets مع Workers Builds**:

- production branch يحدد إلى `develop`.
- build command:
  `cd prototype/p3-lecture-capture-web && pnpm install --frozen-lockfile && pnpm run build`
- production deploy command: `npx wrangler deploy`.
- non-production deploy command: `npx wrangler versions upload`.
- Builds for non-production branches: Enabled.
- لا ربط ولا نشر قبل موافقة المستخدم وبعد نجاح Device Gate المطلوب.

مراجع المزود:

- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/

## فحوصات القبول عند الربط لاحقاً

1. تأكيد أن commit الظاهر في Preview يطابق SHA في GitHub.
2. فتح Capture وCloseout وLibrary وReliability مباشرة ومن خلال التنقل.
3. فتح PDF.js worker من نفس origin بلا CORS أو 404.
4. تسجيل Service Worker وتحديثه بعد commit جديد.
5. إنشاء بيانات IndexedDB، إغلاق المعاينة وإعادة فتح نفس الرابط.
6. التأكد أن Preview لفرع آخر لا يخلط بيانات origin الأول.
7. تنفيذ بوابة MatePad على رابط Preview المعتمد.
