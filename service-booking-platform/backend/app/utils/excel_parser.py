import io
from typing import Any

import openpyxl

REQUIRED_CATALOG_COLUMNS = {"name", "description", "category", "price_range"}
OPTIONAL_CATALOG_COLUMNS = {"image_filename"}


# Validates file extension and orchestrates spreadsheet ingestion into normalized record dictionaries
def validate_and_parse_catalog(file_bytes: bytes, filename: str) -> list[dict[str, Any]]:
    """Parses an XLSX/CSV catalog file and validates required column headers.

    Returns a list of row dicts with normalized keys.
    Raises ValueError on schema violations.
    """
    if filename.endswith((".xlsx", ".xls")):
        return _parse_xlsx(file_bytes)
    raise ValueError(f"Unsupported file format: {filename}. Expected .xlsx or .xls")


# Parses Excel workbook bytes, verifies column schema, and maps tabular data rows
def _parse_xlsx(file_bytes: bytes) -> list[dict[str, Any]]:
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)
    ws = wb.active
    if ws is None:
        raise ValueError("Workbook has no active worksheet")

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise ValueError("Empty spreadsheet")

    raw_headers = [str(h).strip().lower().replace(" ", "_") if h else "" for h in rows[0]]
    header_set = set(raw_headers)

    missing = REQUIRED_CATALOG_COLUMNS - header_set
    if missing:
        raise ValueError(f"Missing required columns: {', '.join(sorted(missing))}")

    records: list[dict[str, Any]] = []
    for row_idx, row in enumerate(rows[1:], start=2):
        row_dict = {header: (str(val).strip() if val is not None else None) for header, val in zip(raw_headers, row)}
        if not row_dict.get("name"):
            continue
        records.append(row_dict)

    if not records:
        raise ValueError("No valid data rows found after header")

    wb.close()
    return records
