# -*- coding: utf-8 -*-
import json
import re
import pathlib
from collections import Counter

root = pathlib.Path(r"c:\Users\Aspire\Desktop\URGEN WEB")
rows = json.loads((root / "tmp-urgen-tests.json").read_text(encoding="utf-8"))

CAT_MAP = {
    "Immunohistochemistry": "immunohistochemistry",
    "Oncology": "oncology_somatic",
    "Hereditary Cancer Genetics": "hereditary_cancer",
    "Reproductive Health": "reproductive",
    "Non-Invasive Prenatal Testing (NIPT)": "nipt",
    "Pediatric": "pediatric_newborn",
}
CAT_SUFFIX = {
    "immunohistochemistry": "ihc",
    "oncology_somatic": "oncology",
    "hereditary_cancer": "hereditary",
    "reproductive": "reproductive",
    "nipt": "nipt",
    "pediatric_newborn": "pediatric",
}



def normalize_slug(raw: str) -> str:
    s = (raw or "").strip()
    s = s.replace("\\", "-").replace("/", "-").replace(" ", "-")
    s = re.sub(r"[()]+", "", s)
    s = re.sub(r",+", "-", s)
    s = re.sub(r"-+", "-", s)
    s = s.strip("-").lower()
    s = re.sub(r"[^a-z0-9._αβ+-]", "-", s, flags=re.I)
    s = re.sub(r"-+", "-", s).strip("-")
    return (s or "test")[:120]


def ts_str(s) -> str:
    s = "" if s is None else str(s).strip()
    return json.dumps(s, ensure_ascii=False)


def format_price(val, lang):
    if val is None or val == "":
        return ""
    try:
        n = int(float(val))
    except Exception:
        return str(val)
    if lang == "en":
        return f"List price: {n:,} IQD"
    return f"السعر القائمة: {n:,} د.ع".replace(",", "٬")


prepared = []
for r in rows:
    cat = CAT_MAP[r["Category"]]
    base = normalize_slug(r.get("Test slug") or r.get("Title (English)") or "test")
    prepared.append({**r, "_cat": cat, "_base": base})

counts = Counter(p["_base"] for p in prepared)
used = set()
final = []
for p in prepared:
    slug = p["_base"]
    if counts[slug] > 1:
        slug = f"{slug}-{CAT_SUFFIX[p['_cat']]}"
    orig = slug
    i = 2
    while slug in used:
        slug = f"{orig}-{i}"
        i += 1
    used.add(slug)

    title_ar = (p.get("Title (Arabic)") or p.get("Title (English)") or "").strip()
    title_en = (p.get("Title (English)") or title_ar).strip()
    desc_ar = (p.get("Short description (Arabic)") or "").strip() or title_ar
    desc_en = (p.get("Short description (English)") or "").strip() or title_en
    clin_ar = (p.get("Clinical use (Arabic)") or "").strip()
    clin_en = (p.get("Clinical use (English)") or "").strip()
    sample_ar = (p.get("Sample (Arabic)") or "").strip() or "—"
    sample_en = (p.get("Sample (English)") or sample_ar).strip()
    method_ar = (p.get("Method (Arabic)") or "").strip() or "—"
    method_en = (p.get("Method (English)") or method_ar).strip()
    turn_ar = (p.get("Turnaround (Arabic)") or "").strip() or "—"
    turn_en = (p.get("Turnaround (English)") or turn_ar).strip()
    img = p.get("Image URL (optional)")
    img = None if img in (None, "", "None") else str(img).strip()

    final.append(
        {
            "sort_order": int(p.get("Display order") or 0),
            "slug": slug,
            "category": p["_cat"],
            "title_ar": title_ar,
            "title_en": title_en,
            "description_ar": desc_ar,
            "description_en": desc_en,
            "long_description_ar": desc_ar,
            "clinical_use_ar": clin_ar or desc_ar,
            "clinical_use_en": clin_en or desc_en,
            "sample_ar": sample_ar,
            "sample_en": sample_en,
            "method_ar": method_ar,
            "method_en": method_en,
            "turnaround_ar": turn_ar,
            "turnaround_en": turn_en,
            "price_display_ar": format_price(p.get("Displayed price (Arabic)"), "ar"),
            "price_display_en": format_price(p.get("Displayed price (English)"), "en"),
            "image_url": img,
        }
    )

final.sort(key=lambda x: x["sort_order"] or 9999)
for i, t in enumerate(final, 1):
    t["sort_order"] = i

print("total", len(final), "unique", len({t["slug"] for t in final}))
print("by cat", Counter(t["category"] for t in final))

FILE_MAP = {
    "immunohistochemistry": (
        "immunohistochemistry.ts",
        "immunohistochemistryCatalog",
        "Immunohistochemistry — من قائمة URGEN المحدثة",
    ),
    "oncology_somatic": (
        "oncologySomatic.ts",
        "oncologySomaticCatalog",
        "Oncology / Somatic — من قائمة URGEN المحدثة",
    ),
    "hereditary_cancer": (
        "hereditaryCancer.ts",
        "hereditaryCancerCatalog",
        "Hereditary Cancer Genetics — من قائمة URGEN المحدثة",
    ),
    "reproductive": (
        "reproductive.ts",
        "reproductiveCatalog",
        "Reproductive Health — من قائمة URGEN المحدثة",
    ),
    "nipt": ("nipt.ts", "niptCatalog", "NIPT — من قائمة URGEN المحدثة"),
    "pediatric_newborn": (
        "pediatricNewborn.ts",
        "pediatricNewbornCatalog",
        "Pediatric — من قائمة URGEN المحدثة",
    ),
}

catalog_dir = root / "src" / "data" / "catalog"
for cat, (fname, export_name, comment) in FILE_MAP.items():
    items = [t for t in final if t["category"] == cat]
    lines = [
        "import type { LabTestCatalogEntry } from '../../types/labTest'",
        "",
        f"/** {comment} */",
        f"export const {export_name}: Omit<LabTestCatalogEntry, 'sort_order'>[] = [",
    ]
    for t in items:
        lines.extend(
            [
                "  {",
                f"    slug: {ts_str(t['slug'])},",
                f"    title_ar: {ts_str(t['title_ar'])},",
                f"    description_ar: {ts_str(t['description_ar'])},",
                f"    long_description_ar: {ts_str(t['long_description_ar'])},",
                f"    image_url: {'null' if not t['image_url'] else ts_str(t['image_url'])},",
                f"    category: {ts_str(t['category'])},",
                f"    title_en: {ts_str(t['title_en'])},",
                f"    description_en: {ts_str(t['description_en'])},",
                f"    clinical_use_ar: {ts_str(t['clinical_use_ar'])},",
                f"    clinical_use_en: {ts_str(t['clinical_use_en'])},",
                f"    sample_ar: {ts_str(t['sample_ar'])},",
                f"    sample_en: {ts_str(t['sample_en'])},",
                f"    method_ar: {ts_str(t['method_ar'])},",
                f"    method_en: {ts_str(t['method_en'])},",
                f"    turnaround_ar: {ts_str(t['turnaround_ar'])},",
                f"    turnaround_en: {ts_str(t['turnaround_en'])},",
                f"    price_display_ar: {ts_str(t['price_display_ar'])},",
                f"    price_display_en: {ts_str(t['price_display_en'])},",
                "  },",
            ]
        )
    lines.append("]")
    lines.append("")
    (catalog_dir / fname).write_text("\n".join(lines), encoding="utf-8")
    print("wrote", fname, len(items))


def sql_str(s):
    if s is None:
        return "null"
    return "'" + str(s).replace("'", "''") + "'"


sql = [
    "-- =============================================================================",
    "-- استبدال قائمة الفحوصات بالكامل من URGEN List Test.xlsx",
    f"-- عدد الفحوصات: {len(final)}",
    "-- نفّذ في Supabase SQL Editor",
    "-- =============================================================================",
    "",
    "begin;",
    "",
    "-- 0) إزالة أعمدة التحضير والملاحظات إن وُجدت",
    "alter table public.tests drop column if exists preparation_ar;",
    "alter table public.tests drop column if exists preparation_en;",
    "alter table public.tests drop column if exists limitation_note_ar;",
    "alter table public.tests drop column if exists limitation_note_en;",
    "",
    "-- 1) حذف الفحوصات القديمة",
    "delete from public.tests;",
    "",
    "-- 2) التأكد من التصنيفات",
    """insert into public.test_categories (slug, title_ar, title_en, sort_order)
values
  ('immunohistochemistry', 'Immunohistochemistry', 'Immunohistochemistry', 1),
  ('oncology_somatic', 'Oncology', 'Oncology', 2),
  ('hereditary_cancer', 'Hereditary Cancer Genetics', 'Hereditary Cancer Genetics', 3),
  ('reproductive', 'Reproductive Health', 'Reproductive Health', 4),
  ('nipt', 'Non-Invasive Prenatal Testing (NIPT)', 'Non-Invasive Prenatal Testing (NIPT)', 5),
  ('pediatric_newborn', 'Pediatric', 'Pediatric', 6)
on conflict (slug) do update set
  title_ar = excluded.title_ar,
  title_en = excluded.title_en,
  sort_order = excluded.sort_order;
""",
    "",
    "-- 3) إدراج القائمة الجديدة",
    "insert into public.tests (",
    "  slug, category, title_ar, title_en, description_ar, description_en,",
    "  long_description_ar, long_description_en,",
    "  clinical_use_ar, clinical_use_en, sample_ar, sample_en,",
    "  method_ar, method_en, turnaround_ar, turnaround_en,",
    "  price_display_ar, price_display_en, image_url, sort_order",
    ") values",
]

vals = []
for t in final:
    vals.append(
        "("
        + ", ".join(
            [
                sql_str(t["slug"]),
                sql_str(t["category"]),
                sql_str(t["title_ar"]),
                sql_str(t["title_en"]),
                sql_str(t["description_ar"]),
                sql_str(t["description_en"]),
                sql_str(t["long_description_ar"]),
                sql_str(t["description_en"]),
                sql_str(t["clinical_use_ar"]),
                sql_str(t["clinical_use_en"]),
                sql_str(t["sample_ar"]),
                sql_str(t["sample_en"]),
                sql_str(t["method_ar"]),
                sql_str(t["method_en"]),
                sql_str(t["turnaround_ar"]),
                sql_str(t["turnaround_en"]),
                sql_str(t["price_display_ar"]),
                sql_str(t["price_display_en"]),
                "null" if not t["image_url"] else sql_str(t["image_url"]),
                str(t["sort_order"]),
            ]
        )
        + ")"
    )

sql.append(",\n".join(vals) + ";")
sql.extend(
    [
        "",
        "commit;",
        "",
        "select count(*) as tests_count from public.tests;",
        "select category, count(*) from public.tests group by category order by min(sort_order);",
    ]
)

sql_path = root / "supabase" / "replace-tests-from-urgen-list.sql"
sql_path.write_text("\n".join(sql), encoding="utf-8")
print("wrote", sql_path.name, "bytes", sql_path.stat().st_size)

(root / "tmp-urgen-tests-slugs.json").write_text(
    json.dumps(
        [
            {
                "order": t["sort_order"],
                "slug": t["slug"],
                "category": t["category"],
                "title_en": t["title_en"],
            }
            for t in final
        ],
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
print("done")
