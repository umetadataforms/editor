import re
import sys
from datetime import datetime
from typing import NoReturn

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
DATETIME_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$"
)


def is_int(value: str) -> bool:
    return bool(re.match(r"^-?\d+$", value))


def is_float(value: str) -> bool:
    try:
        float(value)
        return True
    except ValueError:
        return False


def parse_datetime(value: str) -> datetime:
    normalized = value.strip().replace(" ", "T")
    if normalized.endswith("Z"):
        normalized = normalized[:-1] + "+00:00"
    return datetime.fromisoformat(normalized)


def is_date(value: str) -> bool:
    if not DATE_RE.match(value):
        return False
    try:
        datetime.strptime(value, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def is_datetime(value: str) -> bool:
    if not DATETIME_RE.match(value):
        return False
    try:
        parse_datetime(value)
        return True
    except ValueError:
        return False


def infer_data_type(values: list[str]) -> tuple[str, str | None]:
    if not values:
        return "string", None

    if all(is_date(v) for v in values):
        return "date", "YYYY-MM-DD"

    if all(is_datetime(v) for v in values):
        return "datetime", "YYYY-MM-DDTHH:MM:SS"

    if all(is_int(v) for v in values):
        return "integer", None

    if all(is_float(v) for v in values):
        return "float", None

    return "string", None


def sanitize_label(raw: str, index: int) -> str:
    cleaned = re.sub(r"\s+", " ", raw).strip()

    if len(cleaned) < 2:
        cleaned = f"Field{index + 1}"

    return cleaned[:75]


def unique_label(label: str, seen: dict[str, int]) -> str:
    if label not in seen:
        seen[label] = 1
        return label

    seen[label] += 1
    return f"{label}{seen[label]}"


def fail(message: str) -> NoReturn:
    sys.stderr.write(f"{message}\n")
    sys.exit(1)
