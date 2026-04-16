import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, NoReturn
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT_DIR = ROOT / "python" / "tests" / "data"
DEFAULT_OUTPUT_DIR = ROOT / "python" / "tests" / "output"
DEFAULT_GENERATOR = ROOT / "python" / "scripts" / "metadata_from_tabular_v0.0.2.py"
MAX_ROWS = "100"
SCHEMAS_DIR = ROOT / "src" / "schemas" / "tabular-data-metadata"


def fail(message: str) -> NoReturn:
    sys.stderr.write(f"{message}\n")
    sys.exit(1)


def run_generator(python_bin: str, script_path: str, input_path: str) -> dict[str, Any]:
    result = subprocess.run(
        [python_bin, script_path, "--input", input_path, "--max-rows", MAX_ROWS],
        check=False,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        fail(result.stderr.strip() or "generator-failed")

    try:
        payload = json.loads(result.stdout)
        if isinstance(payload, dict):
            return payload
        fail("invalid-json-payload")
    except json.JSONDecodeError as exc:
        fail(f"invalid-json: {exc}")


def load_schema_map() -> dict[str, dict[str, Any]]:
    if not SCHEMAS_DIR.is_dir():
        fail(f"schemas-dir-not-found: {SCHEMAS_DIR}")

    schema_map: dict[str, dict[str, Any]] = {}
    for schema_path in sorted(SCHEMAS_DIR.glob("*.json")):
        with schema_path.open("r", encoding="utf-8") as handle:
            schema = json.load(handle)
        if not isinstance(schema, dict):
            continue
        schema_id = schema.get("$id")
        if not schema_id or not isinstance(schema_id, str):
            continue
        schema_key = schema_id.replace("standalone", "modular")
        schema_map[schema_key] = schema
    if not schema_map:
        fail(f"no-schemas-loaded: {SCHEMAS_DIR}")
    return schema_map


def resolve_schema(
    payload: dict[str, Any], schema_map: dict[str, dict[str, Any]]
) -> dict[str, Any]:
    schema_key = payload.get("schema") or payload.get("$schema")
    if not schema_key or not isinstance(schema_key, str):
        fail("payload-missing-schema")
    schema = schema_map.get(schema_key)
    if schema is None:
        fail(f"schema-not-mapped: {schema_key}")
    return schema


def validate_payload(
    payload: dict[str, Any], schema: dict[str, Any], output_path: Path
) -> None:
    validator = Draft202012Validator(schema)
    errors = sorted(validator.iter_errors(payload), key=lambda err: err.path)
    if errors:
        formatted = [f"{output_path}: {error.message}" for error in errors]
        fail("schema-validation-failed:\n" + "\n".join(formatted))


def find_input_files(input_dir: Path) -> list[Path]:
    if not input_dir.is_dir():
        fail(f"input-dir-not-found: {input_dir}")
    files = [
        path
        for path in input_dir.rglob("*")
        if path.is_file() and path.suffix.lower() in (".csv", ".tsv")
    ]
    if not files:
        fail(f"no-test-files: {input_dir}")
    return sorted(files)


def write_output(payload: dict[str, Any], output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=True)
        handle.write("\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", default=str(DEFAULT_INPUT_DIR))
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--generator", default=str(DEFAULT_GENERATOR))
    args = parser.parse_args()

    python_bin = sys.executable
    generator_path = Path(args.generator)
    if not generator_path.is_file():
        fail(f"generator-not-found: {generator_path}")

    input_dir = Path(args.input_dir)
    output_dir = Path(args.output_dir)

    input_files = find_input_files(input_dir)
    schema_map = load_schema_map()

    for input_path in input_files:
        payload = run_generator(python_bin, str(generator_path), str(input_path))
        schema = resolve_schema(payload, schema_map)
        relative = input_path.relative_to(input_dir)
        output_path = output_dir / relative.with_suffix(".json")
        write_output(payload, output_path)
        validate_payload(payload, schema, output_path)

    print(f"Generator validation OK: {len(input_files)} file(s)")


if __name__ == "__main__":
    main()
