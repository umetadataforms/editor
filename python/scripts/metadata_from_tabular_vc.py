import argparse
import csv
import json
import os
from metadata_utils import fail, infer_data_type, is_int, sanitize_label, unique_label

SCHEMA_URI = "tabular-data-metadata-schema.json"

MAX_SAMPLE_ROWS = 100


def infer_statistical_type(data_type: str, values: list[str]) -> str:
    if data_type == "float":
        return "continuous"

    if data_type == "integer":
        unique_values = {int(v) for v in values if is_int(v)}
        if unique_values and unique_values.issubset({0, 1}) and len(unique_values) <= 2:
            return "binary"
        return "count"

    if data_type in ("datetime", "timedelta"):
        return "ordinal"

    return "nominal"


def infer_variable_type(label: str) -> str:
    lower = label.lower()
    if lower.endswith("id") or lower == "id" or " id" in lower:
        return "id"
    return "feature"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--max-rows", type=int, default=MAX_SAMPLE_ROWS)
    args = parser.parse_args()

    max_rows = max(0, min(args.max_rows, MAX_SAMPLE_ROWS))

    file_path = args.input

    if not file_path or not isinstance(file_path, str):
        fail("file-not-found")

    if not os.path.isfile(file_path):
        fail("file-not-found")

    ext = os.path.splitext(file_path)[1].lower()
    if ext not in (".csv", ".tsv"):
        fail("unsupported-file-format")

    delimiter = "," if ext == ".csv" else "\t"

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
    variables: list[dict[str, object]] = []
    for index, raw_name in enumerate(header_list):
        raw_name = raw_name.strip()
        label = sanitize_label(raw_name or f"Field{index + 1}", index)
        label = unique_label(label, seen_labels)

        values = column_values[index]
        data_type, _ = infer_data_type(values)
        if data_type == "date":
            data_type = "datetime"
        statistical_type = infer_statistical_type(data_type, values)
        variable_type = infer_variable_type(label)

        units = (
            "unknown"
            if statistical_type in ("continuous", "count")
            else "not applicable"
        )
        ordered = statistical_type == "ordinal"

        variable: dict[str, object] = {
            "label": label,
            "description": f"{label} variable",
            "data_type": data_type,
            "variable_type": variable_type,
            "statistical_type": statistical_type,
            "units": units,
            "ordered": ordered,
        }

        variables.append(variable)

    payload = {
        "$schema": SCHEMA_URI,
        "variables": variables,
    }

    print(json.dumps(payload, indent=2, ensure_ascii=True))


if __name__ == "__main__":
    main()
