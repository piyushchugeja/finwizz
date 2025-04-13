import pandas as pd
import json
from dateutil import parser as dateparser
import os

def parse_csv_file(csv_path: str) -> list:
    """
    Reads and parses a bank statement CSV file into normalized transaction records.
    Returns a list of JSON-ready dictionaries.
    """

    if not os.path.isfile(csv_path):
        raise FileNotFoundError("CSV file not found.")

    try:
        df = pd.read_csv(csv_path, encoding='utf-8')
    except Exception:
        df = pd.read_csv(csv_path, encoding='ISO-8859-1')  # fallback

    # Standardize column names
    df.columns = [col.lower().strip() for col in df.columns]

    # Guess relevant columns
    date_col    = next((c for c in df.columns if 'txn' in c or 'date' in c), None)
    desc_col    = next((c for c in df.columns if 'desc' in c), None)
    debit_col   = next((c for c in df.columns if 'debit' in c), None)
    credit_col  = next((c for c in df.columns if 'credit' in c), None)
    balance_col = next((c for c in df.columns if 'balance' in c), None)

    if not date_col or not desc_col:
        raise ValueError("Required columns like 'Txn Date' or 'Description' not found.")

    # Clean & parse data
    df = df.dropna(subset=[date_col, desc_col])
    df['date'] = df[date_col].apply(lambda x: dateparser.parse(str(x), dayfirst=True))
    df['description'] = df[desc_col].astype(str).str.replace(r'\s+', ' ', regex=True).str.strip()
    df['debit'] = pd.to_numeric(df[debit_col], errors='coerce').fillna(0) if debit_col else 0
    df['credit'] = pd.to_numeric(df[credit_col], errors='coerce').fillna(0) if credit_col else 0

    df['amount'] = df.apply(lambda r: -r['debit'] if r['debit'] > 0 else r['credit'], axis=1)

    if balance_col:
        df['balance'] = pd.to_numeric(df[balance_col], errors='coerce')

    # Create final output
    records = []
    for idx, (_, row) in enumerate(df.iterrows(), start=1):
        entry = {
            "serial": idx,
            "date": row["date"].isoformat(),
            "description": row["description"],
            "amount": float(row["amount"])
        }
        if "balance" in row and not pd.isna(row["balance"]):
            entry["balance"] = float(row["balance"])
        records.append(entry)

    return records