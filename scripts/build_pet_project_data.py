from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return slug or "item"


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_skill(skill: dict[str, Any], category: str) -> dict[str, Any]:
    return {
        "name": skill.get("name"),
        "element": skill.get("attr"),
        "type": skill.get("type"),
        "cost": skill.get("consume") if skill.get("consume") is not None else 0,
        "power": skill.get("power") if skill.get("power") is not None else 0,
        "desc": skill.get("desc") or "",
        "icon": skill.get("icon"),
        "category": category,
    }


def dedupe_skills(skills: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[tuple[str, str | None, str | None]] = set()
    result = []
    for skill in skills:
        key = (skill.get("name") or "", skill.get("element"), skill.get("category"))
        if key in seen:
            continue
        seen.add(key)
        result.append(skill)
    return result


def build_world_pet(record: dict[str, Any], index: int) -> dict[str, Any]:
    stats = record.get("stats", {})
    bloodline_skills = [normalize_skill(skill, "bloodline") for skill in record.get("bloodline_skills", [])]
    own_skills = [normalize_skill(skill, "own") for skill in record.get("own_skills", [])]
    skill_stone_skills = [normalize_skill(skill, "skill_stone") for skill in record.get("skill_stones", [])]
    merged_skills = dedupe_skills(bloodline_skills + own_skills + skill_stone_skills)

    return {
        "id": index + 1,
        "key": f"{record.get('no', 'NO.000')}-{slugify(record.get('name', 'unknown'))}-{index + 1}",
        "no": record.get("no"),
        "name": record.get("name"),
        "element": record.get("attributes", []),
        "avatar": record.get("image"),
        "image": record.get("image"),
        "detailUrl": record.get("detail_url"),
        "typeName": record.get("type_name"),
        "typeCode": record.get("type_code"),
        "formName": record.get("form_name"),
        "formCode": record.get("form_code"),
        "hp": stats.get("hp", 0),
        "atk": stats.get("atk", 0),
        "mat": stats.get("matk", 0),
        "matk": stats.get("matk", 0),
        "def": stats.get("def", 0),
        "mdf": stats.get("mdef", 0),
        "mdef": stats.get("mdef", 0),
        "spd": stats.get("spd", 0),
        "trait": record.get("trait") or {"name": "", "desc": ""},
        "restrain": record.get("restrain") or {},
        "evolution": record.get("evolution") or {},
        "bloodlineSkills": bloodline_skills,
        "ownSkills": own_skills,
        "skillStoneSkills": skill_stone_skills,
        "skills": merged_skills,
    }


def build_skill_catalog(records: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    catalog: dict[str, dict[str, Any]] = {}
    for record in records:
        for category, key in (
            ("bloodline", "bloodline_skills"),
            ("own", "own_skills"),
            ("skill_stone", "skill_stones"),
        ):
            for skill in record.get(key, []):
                skill_name = skill.get("name")
                if not skill_name:
                    continue
                if skill_name not in catalog:
                    catalog[skill_name] = normalize_skill(skill, category)
                else:
                    existing = catalog[skill_name]
                    if not existing.get("desc") and skill.get("desc"):
                        existing["desc"] = skill.get("desc")
                    if not existing.get("icon") and skill.get("icon"):
                        existing["icon"] = skill.get("icon")
    return dict(sorted(catalog.items(), key=lambda item: item[0]))


def write_js(
    output_path: Path,
    pets: list[dict[str, Any]],
    skill_catalog: dict[str, Any],
    weakness_table: dict[str, Any],
) -> None:
    content = (
        "window.worldPetList = "
        + json.dumps(pets, ensure_ascii=False, indent=2)
        + ";\n\nwindow.worldWeaknessTable = "
        + json.dumps(weakness_table, ensure_ascii=False, indent=2)
        + ";\n\nwindow.worldSkillCatalog = "
        + json.dumps(skill_catalog, ensure_ascii=False, indent=2)
        + ";\n"
    )
    output_path.write_text(content, encoding="utf-8")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    extracted_path = root / "data" / "extracted" / "lokewangguoshijie_pokemon_extracted.json"
    weakness_path = root / "data" / "source" / "weakness-table.json"
    output_path = root / "pet" / "data" / "world-data.js"

    records = load_json(extracted_path)
    weakness_table = load_json(weakness_path)
    pets = [build_world_pet(record, index) for index, record in enumerate(records)]
    skill_catalog = build_skill_catalog(records)

    write_js(output_path, pets, skill_catalog, weakness_table)

    print(
        json.dumps(
            {
                "input": str(extracted_path),
                "weakness_input": str(weakness_path),
                "output": str(output_path),
                "pet_count": len(pets),
                "weakness_count": len(weakness_table),
                "skill_count": len(skill_catalog),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
