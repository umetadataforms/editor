import argparse
import csv
import hashlib
import json
import os
import re
from metadata_utils import fail, infer_data_type, is_int, sanitize_label, unique_label

SCHEMA_URI = (
    "https://github.com/umetadataforms/schemas/raw/main/modular/"
    "tabular-data-metadata/v0.0.2.json"
)

MAX_SAMPLE_ROWS = 100


def compute_sha256(file_path: str) -> str:
    digest = hashlib.sha256()
    with open(file_path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def infer_measurement_type(data_type: str, values: list[str]) -> str:
    if data_type == "float":
        return "continuous"

    if data_type == "integer":
        unique_values = {int(v) for v in values if is_int(v)}
        if unique_values and unique_values.issubset({0, 1}) and len(unique_values) <= 2:
            return "binary"
        return "discrete"

    if data_type in ("date", "datetime"):
        return "not applicable"

    return "unknown"


def infer_field_role(label: str) -> str:
    lower = label.lower()
    if lower.endswith("id") or " id" in lower or lower == "id":
        return "index"
    return "unknown"


def infer_field_type(label: str, data_type: str) -> str:
    lower = label.lower()
    if data_type in ("date", "datetime"):
        return "record_datetime"
    if lower.endswith("id") or " id" in lower or lower == "id":
        return "subject_id"
    return "standard"


def file_label_from_name(stem: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_]+", "_", stem).strip("_")
    return (cleaned or "file")[:255]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--max-rows", type=int, default=MAX_SAMPLE_ROWS)
    args = parser.parse_args()

    max_rows = max(0, min(args.max_rows, MAX_SAMPLE_ROWS))

    file_path = args.input

    if not os.path.isfile(file_path):
        fail("file-not-found")

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in (".csv", ".tsv"):
        fail("unsupported-file-format")

    delimiter = "," if ext == ".csv" else "\t"
    format_label = "CSV" if ext == ".csv" else "TSV"

    with open(file_path, newline="", encoding="utf-8", errors="replace") as handle:
        reader = csv.reader(handle, delimiter=delimiter)
        header = next(reader, None)
        if header is None:
            fail("missing-header")

        header_list = list(header)
        if len(header_list) == 0:
            fail("missing-header")

        rows: list[list[str]] = []
        for row in reader:
            rows.append(row)
            if len(rows) >= max_rows:
                break

    column_values: list[list[str]] = [[] for _ in range(len(header_list))]
    for row in rows:
        for index in range(len(header_list)):
            value = row[index] if index < len(row) else ""
            value = value.strip()
            if value:
                column_values[index].append(value)

    seen_labels: dict[str, int] = {}
    fields: list[dict[str, object]] = []
    for index, raw_name in enumerate(header_list):
        raw_name = raw_name.strip()
        label = sanitize_label(raw_name or f"Field{index + 1}", index)
        label = unique_label(label, seen_labels)

        values = column_values[index]
        data_type, date_format = infer_data_type(values)
        measurement_type = infer_measurement_type(data_type, values)
        role = infer_field_role(label)
        field_type = infer_field_type(label, data_type)
        categories = (
            "unknown"
            if measurement_type in ("binary", "nominal", "ordinal")
            else "not applicable"
        )
        units = (
            "unknown"
            if measurement_type in ("continuous", "discrete", "count")
            else "not applicable"
        )

        field: dict[str, object] = {
            "label": label,
            "description": "",
            "dataType": data_type,
            "dateFormat": date_format or "not applicable",
            "measurementType": measurement_type,
            "role": role,
            "categories": categories,
            "units": units,
            "missingValueCode": "not applicable",
            "fieldType": field_type,
            "tags": "unknown",
            "resources": "not applicable",
        }

        fields.append(field)

    stem = os.path.splitext(os.path.basename(file_path))[0]

    payload = {
        "schema": SCHEMA_URI,
        "files": [
            {
                "path": os.path.basename(file_path),
                "format": format_label,
                "sha256": compute_sha256(file_path),
                "label": file_label_from_name(stem),
                "title": "",
                "description": "",
            }
        ],
        "fields": fields,
    }

    print(json.dumps(payload, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
