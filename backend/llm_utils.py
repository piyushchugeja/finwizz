import requests

LLM_API_URL = "http://localhost:1234/v1/chat/completions"
MODEL_NAME = "mistral-7b-instruct-v0.1"

def categorize_batch(descriptions):
    prompt = """
            You are a smart financial assistant that classifies bank or UPI transactions into relevant categories and explains the reasoning.

            Your task is to:
            1. Understand the transaction description.
            2. Infer who or what the payment was to (e.g., a person, store, app, platform, bills, shopping (mart or e-commerce) or service).
            3. Determine the most appropriate category from the following:
            [Food, Utilities, Entertainment, Travel, Rent, Health, Transfers, Subscriptions, Education, Shopping, Miscellaneous]

            Classify the following transactions. Return a JSON list like:
            [
            {"category": "...", "note": "..."},
            ...
            ]
            """

    bullet_txns = "\n".join([f"- {desc}" for desc in descriptions])
    full_prompt = prompt + "\n" + bullet_txns

    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": full_prompt}],
        "temperature": 0.3,
        "stream": False,
        "max_tokens": -1
    }

    try:
        res = requests.post(LLM_API_URL, json=payload, timeout=40)
        res.raise_for_status()
        raw = res.json()['choices'][0]['message']['content']
        parsed = eval(raw.strip())
        if isinstance(parsed, list) and all("category" in item for item in parsed):
            return parsed
        else:
            raise ValueError("Unexpected response format")
    except Exception as e:
        print(f"❌ LLM batch error: {e}")
        return [{"category": "Uncategorized", "note": "Failed to classify"} for _ in descriptions]

def categorize_transaction(desc):
    prompt = f"""
            You are a smart financial assistant trained to understand real-world banking and UPI transaction patterns.

            Your job is to:
            1. Carefully analyze the transaction description.
            2. Identify who or what the payment was made to — such as merchants, services, platforms, individuals, bills, shopping portals, ride apps, or wallet transfers.
            3. Use your awareness of popular Indian brands, UPI handles, and transaction patterns to map the description to the most relevant category.

            Choose from the following categories:
            [Salary, Food, Travel, Shopping, Subscriptions, Utilities, Transfers, Wallets, Rent, Health, Education, Entertainment, Miscellaneous]

            🧠 Additional Hints:
            - Recognize vendors like Amazon, Flipkart, Swiggy, Zomato, Ola, Uber, Netflix, Dmart, Myntra, Spotify, etc., based on their UPI handles or common naming.
            - Handle names ending with `@okhdfc`, `@okicici`, etc., often relate to wallet or vendor-specific transactions.
            - Amazon, Flipkart, and other e-commerce platforms should be categorized as "Shopping".
            - Food delivery apps like Swiggy and Zomato should be categorized as "Food".
            - Ride-sharing apps like Ola and Uber should be categorized as "Travel".
            - Subscription services like Netflix and Spotify should be categorized as "Subscriptions".
            - Utility payments (like electricity, water, etc.) should be categorized as "Utilities".
            - Transfers to wallets (like Paytm, PhonePe, etc.) should be categorized as "Transfers".
            - Rent payments should be categorized as "Rent".
            - Health-related payments (like hospitals, clinics, etc.) should be categorized as "Health".
            - Education-related payments (like schools, colleges, etc.) should be categorized as "Education".
            - Entertainment-related payments (like movies, events, etc.) should be categorized as "Entertainment".
            - Electronics(Croma, Maple, etc.) or clothing purchases should be categorized as "Shopping".
            - Hotels, travel bookings, or related expenses should be categorized as "Travel".
            - Miscellaneous payments that don't fit into the above categories should be categorized as "Miscellaneous".
            - Payments to individuals (like friends or family) should be categorized as "Transfers" if they are not brand handles.
            - Salary or income sources should be categorized as "Salary".
            - If the category isn't clear, default to "Miscellaneous" but give a sensible note.

            Now process the following transaction:
            Transaction: "{desc}"

            Respond ONLY with a compact JSON object like this:
            {{"category": ..., "note": ...}}.

            No additional text.
            """

    payload = {
        "model": MODEL_NAME,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "stream": False,
        "max_tokens": -1
    }

    try:
        res = requests.post(LLM_API_URL, json=payload, timeout=20)
        res.raise_for_status()
        raw = res.json()['choices'][0]['message']['content']
        return eval(raw.strip()) 
    except Exception as e:
        print(f"❌ LLM error on: {desc[:50]} — {e}")
        return {"category": "Uncategorized", "note": "Failed to classify"}