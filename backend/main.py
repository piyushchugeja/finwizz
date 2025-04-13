from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
import os
from pymongo import MongoClient
from datetime import datetime, date
import re
from csv_parser import parse_csv_file  
from pdf_parser import parse_pdf_file  
from llm_utils import categorize_transaction
from bson import ObjectId
from urllib.parse import quote_plus
import time

from concurrent.futures import ThreadPoolExecutor
from anomaly_sub_api import analyze_anomalies
from sklearn.ensemble import IsolationForest
import pandas as pd
import requests
import base64
from dotenv import load_dotenv

from flask_cors import CORS

import json

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

executor = ThreadPoolExecutor(max_workers=4)

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")

# 🟢 MongoDB Setup
username = os.getenv("mongo_username")
password = quote_plus(os.getenv("mongo_password"))
MONGO_URI = f"mongodb+srv://{username}:{password}@cluster0.ja9rqdf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(MONGO_URI)
db = client["bank_parser_db"]
collection = db["parsed_statements"]

def background_enrich(upload_id):
    try:
        doc = collection.find_one({"_id": ObjectId(upload_id)})
        if not doc:
            print(f"❌ No document found for {upload_id}")
            return

        txns = doc["data"]
        enriched_txns = []

        for i, txn in enumerate(txns):
            desc = txn.get("description", "")
            enriched = categorize_transaction(desc)
            enriched_txns.append({**txn, **enriched})
            print(f"✅ Processed {i + 1}/{len(txns)} — {desc[:40]}")
            time.sleep(0.1)  # To avoid overwhelming the API

        collection.update_one({"_id": doc["_id"]}, {"$set": {"data": enriched_txns}})
        print(f"🎉 Sequential enrichment complete for {upload_id}")

    except Exception as e:
        print(f"🔥 Error during enrichment: {e}")

def parse_image_with_together_ai(image_path):
    with open(image_path, "rb") as f:
        image_bytes = f.read()
        encoded_image = base64.b64encode(image_bytes).decode("utf-8")
        
    prompt = """
    You are a financial assistant that extracts structured transaction data from images of bank statements, UPI transactions, or payment screenshots.

    Your goal is to extract **all transactions** visible in the image. For each transaction, identify the following:

    - `date`: Date of the transaction (format: YYYY-MM-DD)
    - `description`: A short text describing the transaction (e.g., payment to Airtel, refund from Zomato)
    - `amount`: The numeric amount (positive for credit, negative for debit)
    - `type`: `"credit"` or `"debit"` depending on the direction of money
    - `balance`: The account balance after this transaction, if visible

    Output must be **strictly in this format** no other format:

    ```json
    [
        {
            "date": "2025-03-02",
            "description": "Payment from Manasi Sharma via UPI",
            "amount": 50.0,
            "type": "credit",
            "balance": 29097.45
        },
        {
            "date": "2025-03-03",
            "description": "Payment to Vi telecom",
            "amount": -145.0,
            "type": "debit",
            "balance": 28952.45
        }
    ]```
    
    Rules:
        Return only a valid JSON array of objects, nothing else.
        If any field is missing or unclear, return its value as null.
        Do not include any explanation, extra text, or commentary.
    Begin extracting now.
    """

    url = "https://api.together.xyz/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {TOGETHER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo",
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt,
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded_image}"
                        }
                    }
                ]
            }
        ]
    }

    try:
        response = requests.post(url, headers=headers, json=data, timeout=60)
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        print("🤖 Together AI Vision response:", content)
        match = re.search(r"\[\s*{.*?}\s*\]", content, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print("❌ Error from Together AI Vision:", e)
        return {
            "date": None,
            "description": None,
            "amount": None,
            "type": None,
            "balance": None
        }

def normalize_dates(obj):
    if isinstance(obj, list):
        return [normalize_dates(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: normalize_dates(v) for k, v in obj.items()}
    elif isinstance(obj, date) and not isinstance(obj, datetime):
        return datetime.combine(obj, datetime.min.time())
    return obj

@app.route("/api/parse", methods=["POST"])
def parse_statement():
    if "file" not in request.files or "user_id" not in request.form:
        return jsonify({"error": "File or user_id missing"}), 400

    file = request.files["file"]
    user_id = request.form["user_id"]

    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400

    filename = os.path.basename(file.filename)
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    try:
        if filename.lower().endswith(".csv"):
            parsed_data = parse_csv_file(file_path)
            df = pd.read_csv(file_path)
        elif filename.lower().endswith(".pdf"):
            parsed_data = parse_pdf_file(file_path)
            df = pd.DataFrame(parsed_data) 
        elif filename.lower().endswith((".jpg", ".jpeg", ".png")):
            parsed_data = parse_image_with_together_ai(file_path)
            df = pd.DataFrame(parsed_data)
        else:
            return jsonify({"error": "Unsupported file type"}), 400

        insights = analyze_anomalies(df)

        document = {
            "user_id": user_id,
            "filename": filename,
            "uploaded_at": datetime.utcnow(),
            "type": filename.split(".")[-1],
            "count": len(parsed_data),
            "data": parsed_data,
            "insights": normalize_dates(insights)
        }

        result = collection.insert_one(document)
        upload_id = str(result.inserted_id)
        executor.submit(background_enrich, upload_id)

        return jsonify({
            "message": "File parsed and saved successfully",
            "upload_id": upload_id,
            "count": len(parsed_data),
            "insights": insights
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# ✅ New route to get all data for a user
@app.route("/api/user/<user_id>/statements", methods=["GET"])
def get_user_statements(user_id):
    try:
        statements = list(collection.find({"user_id": user_id}))
        for doc in statements:
            doc["_id"] = str(doc["_id"])  # Convert ObjectId to string

        return jsonify({
            "user_id": user_id,
            "total_uploads": len(statements),
            "uploads": statements
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

 
@app.route("/api/enrich/<upload_id>", methods=["POST"])
def enrich_transactions(upload_id):
    try:
        doc = collection.find_one({"_id": ObjectId(upload_id)})
        if not doc:
            return jsonify({"error": "Upload not found"}), 404

        enriched = []
        for txn in doc["data"]:
            enriched_txn = txn.copy()
            enriched_txn.update(categorize_transaction(txn.get("description", "")))
            enriched.append(enriched_txn)

        collection.update_one({"_id": doc["_id"]}, {"$set": {"data": enriched}})
        return jsonify({
            "message": f"Transactions enriched for upload {upload_id}",
            "count": len(enriched)
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/user/<user_id>/summary", methods=["GET"])
def get_user_summary(user_id):
    try:
        statements = list(collection.find({"user_id": user_id}))

        total_debit = 0
        total_credit = 0
        total_transactions = 0

        for doc in statements:
            for txn in doc.get("data", []):
                amt = txn.get("amount", 0)
                if amt < 0:
                    total_debit += abs(amt)
                else:
                    total_credit += amt
                total_transactions += 1

        return jsonify({
            "user_id": user_id,
            "summary": {
                "total_uploads": len(statements),
                "total_transactions": total_transactions,
                "total_debit": round(total_debit, 2),
                "total_credit": round(total_credit, 2)
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/transaction/update-category", methods=["POST"])
def update_transaction_category():
    data = request.json
    upload_id = data.get("uploadId")
    txn_date = data.get("date")
    description = data.get("description")
    new_category = data.get("category")

    if not all([upload_id, txn_date, description, new_category]):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        result = collection.update_one(
            {
                "_id": ObjectId(upload_id),
                "data": {
                    "$elemMatch": {
                        "date": txn_date,
                        "description": description
                    }
                }
            },
            {
                "$set": {
                    "data.$.category": new_category
                }
            }
        )

        if result.modified_count == 0:
            return jsonify({"error": "Transaction not found or not updated"}), 404

        return jsonify({"message": "Category updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)