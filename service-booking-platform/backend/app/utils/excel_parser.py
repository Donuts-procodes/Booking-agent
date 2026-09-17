import csv
import io
from typing import Any

import openpyxl

REQUIRED_CATALOG_COLUMNS = {"name", "description", "category", "price_range"}
OPTIONAL_CATALOG_COLUMNS = {"image_filename", "image_url"}

import re

# Column aliases to gracefully support different schemas (cars, services, products)
HEADER_ALIASES = {
    "name": ["name", "model", "car_name", "title", "service_name"],
    "category": ["category", "type", "brand", "body_type", "service_category"],
    "description": ["description", "desc", "details", "specifications"],
    "price_range": ["price_range", "price_inr", "price", "cost", "rate"],
    "image_filename": ["image_filename", "image_url", "image", "image_local_url", "thumbnail", "image_base64_thumbnail"],
}


def _clean_header(h: Any) -> str:
    if not h:
        return ""
    # Strip non-alphanumeric except space/underscore
    s = re.sub(r"[^a-zA-Z0-9_\s]", "", str(h))
    return s.strip().lower().replace(" ", "_")


def _normalize_header_map(raw_headers: list[str]) -> dict[str, str]:
    """Maps actual file column headers to standard canonical keys."""
    header_map: dict[str, str] = {}
    clean_headers = [_clean_header(h) for h in raw_headers]

    for canonical, aliases in HEADER_ALIASES.items():
        for idx, header in enumerate(clean_headers):
            if header in aliases:
                header_map[raw_headers[idx]] = canonical
                break
    return header_map


# Validates file extension and orchestrates spreadsheet ingestion into normalized record dictionaries
def validate_and_parse_catalog(file_bytes: bytes, filename: str) -> list[dict[str, Any]]:
    """Parses an XLSX/XLS/CSV catalog file and validates column headers.

    Returns a list of row dicts with normalized keys.
    Raises ValueError on schema violations.
    """
    lower_fn = filename.lower()
    if lower_fn.endswith((".xlsx", ".xls")):
        return _parse_xlsx(file_bytes)
    elif lower_fn.endswith(".csv"):
        return _parse_csv(file_bytes)
    raise ValueError(f"Unsupported file format: {filename}. Expected .xlsx, .xls, or .csv")


def _build_records_from_matrix(rows: list[list[Any]]) -> list[dict[str, Any]]:
    if not rows:
        raise ValueError("Empty spreadsheet")

    raw_headers = [str(h).strip() if h is not None else "" for h in rows[0]]
    header_map = _normalize_header_map(raw_headers)

    # Check if required canonical columns can be matched
    matched_canonicals = set(header_map.values())
    missing = REQUIRED_CATALOG_COLUMNS - matched_canonicals
    if missing:
        raise ValueError(
            f"Missing required columns: {', '.join(sorted(missing))}. "
            f"Available headers: {', '.join(filter(None, raw_headers))}"
        )

    records: list[dict[str, Any]] = []
    for row in rows[1:]:
        row_dict: dict[str, Any] = {}
        for original_col, val in zip(raw_headers, row):
            canonical = header_map.get(original_col)
            if canonical:
                row_dict[canonical] = str(val).strip() if val is not None else None
            # Also preserve the original fields
            clean_orig = original_col.lower().replace(" ", "_")
            if clean_orig:
                row_dict[clean_orig] = str(val).strip() if val is not None else None

        if not row_dict.get("name"):
            continue
        records.append(row_dict)

    if not records:
        raise ValueError("No valid data rows found after header")

    return records


# Parses Excel workbook bytes
def _parse_xlsx(file_bytes: bytes) -> list[dict[str, Any]]:
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
    # Prefer 'Car Catalog' sheet if present, otherwise active worksheet
    sheet_name = "Car Catalog" if "Car Catalog" in wb.sheetnames else wb.sheetnames[0]
    ws = wb[sheet_name]
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    wb.close()
    return _build_records_from_matrix(rows)


# Parses CSV bytes
def _parse_csv(file_bytes: bytes) -> list[dict[str, Any]]:
    text = file_bytes.decode("utf-8-sig", errors="replace")
    reader = csv.reader(io.StringIO(text))
    rows = [row for row in reader if any(row)]
    return _build_records_from_matrix(rows)

