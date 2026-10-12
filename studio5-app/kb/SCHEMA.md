# Studio5 knowledge library — file format

Each file is a JSON array of topic objects. UTF-8, valid JSON (no comments, no trailing commas).

```json
{
  "id": "civ-som-03",                       // unique: <group>-<subject-short>-<nn>, lowercase a-z0-9-
  "subjects": ["Strength of Materials"],    // EXACT English subject names from the list you were given (1+)
  "program": "civil",                       // "civil" | "arch" | "both"
  "year": 2,                                // study year 1-5
  "order": 3,                               // teaching order inside the subject (1 = first lesson)
  "title_en": "Bending stress in beams",
  "title_ar": "إجهاد الانحناء في العتبات",
  "summary_ar": "120-200 words of clear Modern Standard Arabic (Iraqi-student friendly) that TEACHES the idea: what it is, why it matters, how it works. Put the English technical term in parentheses after each key Arabic term the first time, e.g. العزم (Moment).",
  "key_points_ar": ["4-7 short bullet facts a student must remember"],
  "formulas": [ { "name": "Flexure formula", "expr": "σ = M·y / I", "vars": "σ bending stress (MPa), M moment (N·mm), y distance from neutral axis (mm), I second moment of area (mm⁴)" } ],
  "example": {
    "problem_ar": "A concrete numeric problem in Arabic with SI units",
    "steps_ar": ["step 1 with the numbers substituted", "step 2", "..."],
    "answer": "final numeric answer with units"
  },
  "mistakes_ar": ["2-4 common student mistakes"],
  "quiz": [
    { "q_ar": "question", "choices": ["a", "b", "c", "d"], "answer": 1, "why_ar": "one-line reason" },
    { "q_ar": "short-answer question", "answer_ar": "model answer" }
  ],
  "keywords": ["english keywords", "كلمات عربية", "synonyms students might type"]
}
```

Rules
- Accuracy first: standard textbook content only (Hibbeler, Gere, Das, Mamlouk, McCormac/ACI 318, Nilson, Neufert, Ching, Fletcher, Lechner...). SI units. When a code clause is used, name the code (ACI 318-19, AISC 360-16, AASHTO, Iraqi Building Code where you are sure). If unsure of a number, do not invent it — explain the method instead.
- Every example must be numerically correct: compute it carefully and re-check the arithmetic.
- Non-numeric subjects (history, theory, design, planning): "formulas" may be [] and "example" becomes a worked analysis/case (problem_ar = task, steps_ar = reasoning steps, answer = conclusion).
- 3-5 quiz items per topic, at least 2 multiple-choice. "answer" for multiple choice is the 0-based index.
- Arabic text in Modern Standard Arabic; keep formulas and symbols in Latin script.
