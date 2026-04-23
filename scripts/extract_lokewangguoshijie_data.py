from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any
from urllib.request import urlopen


BASE_URL = "https://lokewangguoshijie.com"
DATASETS = {
    "pokemon": f"{BASE_URL}/data/pokemon.json",
    "details": f"{BASE_URL}/data/details.json",
    "skills": f"{BASE_URL}/data/skills.json",
}


def fetch_json(url: str) -> Any:
    with urlopen(url) as response:
        return json.loads(response.read().decode("utf-8"))


def expand_skill_names(skill_names: list[str], skills_db: dict[str, Any]) -> list[dict[str, Any]]:
    expanded = []
    for skill_name in skill_names or []:
        skill = skills_db.get(skill_name, {})
        expanded.append(
            {
                "name": skill_name,
                "attr": skill.get("attr"),
                "power": skill.get("power"),
                "type": skill.get("type"),
                "consume": skill.get("consume"),
                "desc": skill.get("desc"),
                "icon": build_absolute_url(skill.get("icon")),
            }
        )
    return expanded


def build_absolute_url(path: str | None) -> str | None:
    if not path:
        return None
    if path.startswith("http://") or path.startswith("https://"):
        return path
    return f"{BASE_URL}{path}"


def build_record(pokemon: dict[str, Any], detail: dict[str, Any], skills_db: dict[str, Any]) -> dict[str, Any]:
    bloodline_skills = detail.get("bloodlineSkills", [])
    own_skills = detail.get("skills", [])
    skill_stones = detail.get("skillStones", [])

    return {
        "no": pokemon.get("no"),
        "name": pokemon.get("name"),
        "image": build_absolute_url(pokemon.get("image")),
        "detail_url": pokemon.get("detailUrl"),
        "attributes": pokemon.get("attrNames", []),
        "attribute_icons": [build_absolute_url(item) for item in pokemon.get("attributes", [])],
        "type_name": pokemon.get("typeName"),
        "type_code": pokemon.get("type"),
        "form_name": pokemon.get("formName"),
        "form_code": pokemon.get("form"),
        "trait": detail.get("trait"),
        "stats": detail.get("stats", {}),
        "restrain": detail.get("restrain", {}),
        "evolution": detail.get("evolution", {}),
        "bloodline_skill_names": bloodline_skills,
        "bloodline_skills": expand_skill_names(bloodline_skills, skills_db),
        "own_skill_names": own_skills,
        "own_skills": expand_skill_names(own_skills, skills_db),
        "skill_stone_names": skill_stones,
        "skill_stones": expand_skill_names(skill_stones, skills_db),
    }


def build_csv_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for record in records:
        stats = record.get("stats", {})
        restrain = record.get("restrain", {})
        trait = record.get("trait") or {}
        rows.append(
            {
                "no": record.get("no"),
                "name": record.get("name"),
                "attributes": "|".join(record.get("attributes", [])),
                "type_name": record.get("type_name"),
                "form_name": record.get("form_name"),
                "hp": stats.get("hp"),
                "atk": stats.get("atk"),
                "matk": stats.get("matk"),
                "def": stats.get("def"),
                "mdef": stats.get("mdef"),
                "spd": stats.get("spd"),
                "trait_name": trait.get("name"),
                "trait_desc": trait.get("desc"),
                "bloodline_skill_names": "|".join(record.get("bloodline_skill_names", [])),
                "own_skill_names": "|".join(record.get("own_skill_names", [])),
                "skill_stone_names": "|".join(record.get("skill_stone_names", [])),
                "strong_against": "|".join(restrain.get("strongAgainst", [])),
                "weak_against": "|".join(restrain.get("weakAgainst", [])),
                "resist": "|".join(restrain.get("resist", [])),
                "resisted": "|".join(restrain.get("resisted", [])),
                "detail_url": record.get("detail_url"),
                "image": record.get("image"),
            }
        )
    return rows


def build_species_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for record in records:
        stats = record.get("stats", {})
        trait = record.get("trait") or {}
        rows.append(
            {
                "no": record.get("no"),
                "name": record.get("name"),
                "attributes": "|".join(record.get("attributes", [])),
                "type_name": record.get("type_name"),
                "type_code": record.get("type_code"),
                "form_name": record.get("form_name"),
                "form_code": record.get("form_code"),
                "hp": stats.get("hp"),
                "atk": stats.get("atk"),
                "matk": stats.get("matk"),
                "def": stats.get("def"),
                "mdef": stats.get("mdef"),
                "spd": stats.get("spd"),
                "trait_name": trait.get("name"),
                "trait_desc": trait.get("desc"),
                "image": record.get("image"),
                "detail_url": record.get("detail_url"),
            }
        )
    return rows


def build_skill_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    category_mappings = [
        ("bloodline", "bloodline_skills"),
        ("own", "own_skills"),
        ("skill_stone", "skill_stones"),
    ]

    for record in records:
        for category, key in category_mappings:
            for order_index, skill in enumerate(record.get(key, []), start=1):
                rows.append(
                    {
                        "no": record.get("no"),
                        "name": record.get("name"),
                        "category": category,
                        "order": order_index,
                        "skill_name": skill.get("name"),
                        "skill_attr": skill.get("attr"),
                        "skill_power": skill.get("power"),
                        "skill_type": skill.get("type"),
                        "skill_consume": skill.get("consume"),
                        "skill_desc": skill.get("desc"),
                        "skill_icon": skill.get("icon"),
                    }
                )
    return rows


def build_counter_rows(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    counter_mappings = [
        ("strongAgainst", "strong_against"),
        ("weakAgainst", "weak_against"),
        ("resist", "resist"),
        ("resisted", "resisted"),
    ]

    for record in records:
        restrain = record.get("restrain", {})
        for source_key, relation in counter_mappings:
            for target_attr in restrain.get(source_key, []):
                rows.append(
                    {
                        "no": record.get("no"),
                        "name": record.get("name"),
                        "relation": relation,
                        "target_attribute": target_attr,
                    }
                )
    return rows


def build_skill_catalog_rows(skills: dict[str, Any]) -> list[dict[str, Any]]:
    rows = []
    for skill_name, skill in skills.items():
        rows.append(
            {
                "skill_name": skill_name,
                "skill_attr": skill.get("attr"),
                "skill_power": skill.get("power"),
                "skill_type": skill.get("type"),
                "skill_consume": skill.get("consume"),
                "skill_desc": skill.get("desc"),
                "skill_icon": build_absolute_url(skill.get("icon")),
            }
        )
    rows.sort(key=lambda row: row["skill_name"])
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    output_dir = root / "data" / "extracted"
    output_dir.mkdir(parents=True, exist_ok=True)

    pokemon_list = fetch_json(DATASETS["pokemon"])
    details = fetch_json(DATASETS["details"])
    skills = fetch_json(DATASETS["skills"])

    records = [build_record(pokemon, details.get(pokemon["name"], {}), skills) for pokemon in pokemon_list]
    csv_rows = build_csv_rows(records)
    species_rows = build_species_rows(records)
    skill_rows = build_skill_rows(records)
    counter_rows = build_counter_rows(records)
    skill_catalog_rows = build_skill_catalog_rows(skills)

    json_path = output_dir / "lokewangguoshijie_pokemon_extracted.json"
    csv_path = output_dir / "lokewangguoshijie_pokemon_extracted.csv"
    meta_path = output_dir / "lokewangguoshijie_extraction_meta.json"
    species_csv_path = output_dir / "lokewangguoshijie_species.csv"
    skills_csv_path = output_dir / "lokewangguoshijie_species_skills.csv"
    counters_csv_path = output_dir / "lokewangguoshijie_species_counters.csv"
    skill_catalog_csv_path = output_dir / "lokewangguoshijie_skill_catalog.csv"

    json_path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    write_csv(csv_path, csv_rows)
    write_csv(species_csv_path, species_rows)
    write_csv(skills_csv_path, skill_rows)
    write_csv(counters_csv_path, counter_rows)
    write_csv(skill_catalog_csv_path, skill_catalog_rows)

    meta = {
        "source": BASE_URL,
        "datasets": DATASETS,
        "record_count": len(records),
        "detail_count": len(details),
        "skill_count": len(skills),
        "json_output": str(json_path),
        "csv_output": str(csv_path),
        "species_csv_output": str(species_csv_path),
        "species_skill_csv_output": str(skills_csv_path),
        "species_counter_csv_output": str(counters_csv_path),
        "skill_catalog_csv_output": str(skill_catalog_csv_path),
        "species_row_count": len(species_rows),
        "species_skill_row_count": len(skill_rows),
        "species_counter_row_count": len(counter_rows),
        "skill_catalog_row_count": len(skill_catalog_rows),
    }
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(meta, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
