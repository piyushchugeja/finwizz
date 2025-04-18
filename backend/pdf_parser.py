import os
import re
import camelot
import pdfplumber
import pandas as pd
from fuzzywuzzy import fuzz
from dateutil import parser as dateparser


HEADER_MAP = {
    "value date":  ["date", "txn date", "value date", "transaction date"],
    "description": ["particulars", "narration", "description", "remarks"],
    "debit":       ["withdrawal", "dr", "debit", "paid"],
    "credit":      ["deposit", "cr", "credit", "received"],
    "balance":     ["balance", "closing balance", "bal"]
}

def parse_pdf_file(pdf_path: str) -> list:
    if not os.path.isfile(pdf_path):
        raise FileNotFoundError("PDF file not found.")

    def map_header(col_name: str):
        name = str(col_name or "").strip().lower()
        for key, variants in HEADER_MAP.items():
            for v in variants:
                if name == v or fuzz.ratio(name, v) > 80:
                    return key
        return None

    def parse_amount(val):
        if pd.isna(val):
            return 0
        val = str(val).strip().replace(",", "")
        if "cr" in val.lower():
            return float(re.sub(r"[^\d.]", "", val))
        elif "dr" in val.lower():
            return -float(re.sub(r"[^\d.]", "", val))
        try:
            return float(val)
        except:
            return 0

    def clean_and_parse(df: pd.DataFrame) -> pd.DataFrame:
        df = df.dropna(subset=["value date", "description"])
        df["value date"] = df["value date"].apply(lambda s: dateparser.parse(str(s), dayfirst=True))
        df["debit"] = df["debit"].apply(parse_amount) if "debit" in df.columns else 0
        df["credit"] = df["credit"].apply(parse_amount) if "credit" in df.columns else 0
        df["amount"] = df.apply(lambda r: -r["debit"] if r["debit"] > 0 else r["credit"], axis=1)
        df["description"] = df["description"].astype(str).str.replace(r"\s+", " ", regex=True).str.strip()
        if "balance" in df.columns:
            df["balance"] = df["balance"].apply(parse_amount)
        df = df.reset_index(drop=True)
        df.insert(0, "serial", df.index + 1)
        cols = ["serial", "value date", "description", "amount"]
        if "balance" in df.columns:
            cols.append("balance")
        return df[cols]

    def text_to_df(raw_text: str) -> pd.DataFrame:
        lines = raw_text.splitlines()
        records = []
        pattern = re.compile(r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}).+?(-?\d+[.,]?\d*)\s+(-?\d+[.,]?\d*)")
        for line in lines:
            m = pattern.search(line)
            if m:
                date_str, debit_str, credit_str = m.groups()
                desc = line[:m.start(1)].strip() or line[m.end(1):m.start(2)].strip()
                records.append({
                    "value date": date_str,
                    "description": desc,
                    "debit": debit_str if float(debit_str.replace(",", "")) > 0 else "",
                    "credit": credit_str if float(credit_str.replace(",", "")) > 0 else ""
                })
        return pd.DataFrame(records)

    # --- Main Logic ---
    all_records = []

    try:
        tables = camelot.read_pdf(pdf_path, pages="all", flavor="lattice")
        if tables.n == 0:
            tables = camelot.read_pdf(pdf_path, pages="all", flavor="stream")
    except Exception:
        tables = []

    if tables and tables.n > 0:
        for idx, table in enumerate(tables):
            df = table.df
            raw_cols = [str(c) for c in df.iloc[0].tolist()]
            mapped = [map_header(c) for c in raw_cols]

            # Fix mismatch by trimming or padding
            if len(mapped) < df.shape[1]:
                mapped += [None] * (df.shape[1] - len(mapped))  # pad
            elif len(mapped) > df.shape[1]:
                mapped = mapped[:df.shape[1]]  # trim
                
            matched_cols = [col for col in mapped if col in ["value date", "description", "debit", "credit"]]

            if len(matched_cols) >= 2:
                df = df[1:].copy()
                df.columns = mapped
                df = df.loc[:, df.columns.notna()]

                try:
                    df = clean_and_parse(df)
                    for _, row in df.iterrows():
                        rec = {
                            "serial": int(row["serial"]),
                            "value date": row["value date"].isoformat(),
                            "description": row["description"],
                            "amount": float(row["amount"])
                        }
                        if "balance" in row:
                            rec["balance"] = float(row["balance"])
                        all_records.append(rec)
                except Exception as e:
                    print(f"Failed to clean table {idx + 1}: {e}")
    else:
        with pdfplumber.open(pdf_path) as pdf:
            raw = "\n".join(page.extract_text() or "" for page in pdf.pages)
        df = text_to_df(raw)
        df = clean_and_parse(df)
        for _, row in df.iterrows():
            rec = {
                "serial": int(row["serial"]),
                "value date": row["value date"].isoformat(),
                "description": row["description"],
                "amount": float(row["amount"])
            }
            if "balance" in row:
                rec["balance"] = float(row["balance"])
            all_records.append(rec)

    return all_records