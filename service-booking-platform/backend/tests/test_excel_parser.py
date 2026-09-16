import io
import openpyxl
import pytest
from app.utils.excel_parser import validate_and_parse_catalog


def test_excel_parser_valid():
    wb = openpyxl.Workbook()
    ws = wb.active
    assert ws is not None
    ws.append(["Name", "Category", "Description", "Price Range"])
    ws.append(["Haircut", "Hair Salon", "Classic haircut and wash", "$35 - $50"])
    ws.append(["Beard Trim", "Hair Salon", "Beard styling and oil", "$20"])

    buf = io.BytesIO()
    wb.save(buf)
    file_bytes = buf.getvalue()

    records = validate_and_parse_catalog(file_bytes, "services.xlsx")
    assert len(records) == 2
    assert records[0]["name"] == "Haircut"
    assert records[0]["category"] == "Hair Salon"
    assert records[0]["price_range"] == "$35 - $50"
    assert records[1]["name"] == "Beard Trim"


def test_excel_parser_missing_column():
    wb = openpyxl.Workbook()
    ws = wb.active
    assert ws is not None
    ws.append(["Name", "Category"])  # Missing description and price_range
    ws.append(["Haircut", "Hair Salon"])

    buf = io.BytesIO()
    wb.save(buf)
    file_bytes = buf.getvalue()

    with pytest.raises(ValueError, match="Missing required columns"):
        validate_and_parse_catalog(file_bytes, "bad_schema.xlsx")


def test_excel_parser_unsupported_format():
    with pytest.raises(ValueError, match="Unsupported file format"):
        validate_and_parse_catalog(b"data", "catalog.pdf")
