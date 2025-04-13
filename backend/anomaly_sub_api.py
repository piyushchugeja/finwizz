import pandas as pd
from sklearn.ensemble import IsolationForest
import re
from datetime import datetime

def extract_subscription_handle(desc):
    match = re.search(r'([\w]+@[A-Za-z0-9]+)', str(desc))
    return match.group(1).lower() if match else str(desc).lower()

def detect_hidden_subscriptions(df):
    df['Value Date'] = pd.to_datetime(df['Value Date'], format='%d %b %Y', errors='coerce')
    df['Debit'] = pd.to_numeric(df['Debit'], errors='coerce')
    df['Subscription Handle'] = df['Description'].apply(extract_subscription_handle)

    subscriptions = []
    groups = df.groupby(['Subscription Handle', 'Debit'])
    for (handle, amount), group in groups:
        if len(group) < 3:
            continue
        group_sorted = group.sort_values(by='Value Date')
        gaps = group_sorted['Value Date'].diff().dropna().dt.days
        if gaps.empty:
            continue
        median_gap = gaps.median()
        if 27 <= median_gap <= 33:
            subscriptions.append({
                'handle': handle,
                'amount': float(amount),
                'transactions': group_sorted[['Value Date', 'Debit', 'Description']].to_dict(orient='records')
            })
    return subscriptions

def analyze_anomalies(df):
    df.columns = ['Value Date', 'Description', 'Ref', 'Debit', 'Credit', 'Balance']
    df['Value Date'] = pd.to_datetime(df['Value Date'], errors='coerce')
    df['Debit'] = pd.to_numeric(df['Debit'], errors='coerce')
    df['Credit'] = pd.to_numeric(df['Credit'], errors='coerce')

    # Daily debit anomalies
    debit_df = df[df['Debit'].notna()].copy()
    daily_stats = debit_df.groupby(debit_df['Value Date'].dt.date).agg(
        num_transactions=('Debit', 'count'),
        total_debit=('Debit', 'sum'),
    ).reset_index()

    iso = IsolationForest(contamination=0.08, random_state=42)
    daily_features = daily_stats[['num_transactions', 'total_debit']]
    daily_stats['anomaly'] = iso.fit_predict(daily_features)

    daily_anomalies = daily_stats[daily_stats['anomaly'] == -1].to_dict(orient='records')

    # High-value transactions
    iso_single = IsolationForest(contamination=0.03, random_state=42)
    debit_df['single_txn_anomaly'] = iso_single.fit_predict(debit_df[['Debit']])
    high_value_txns = debit_df[debit_df['single_txn_anomaly'] == -1][['Value Date', 'Description', 'Debit']]
    high_value_anomalies = high_value_txns.to_dict(orient='records')

    hidden_subs = detect_hidden_subscriptions(df)

    return {
        'daily_anomalies': daily_anomalies,
        'high_value_anomalies': high_value_anomalies,
        'hidden_subscriptions': hidden_subs
    }