# FinWizz – by CodeBrew

FinWizz is an intelligent personal finance analyzer that helps users make smarter financial decisions by parsing their bank statements or UPI transaction history. It automatically detects hidden subscriptions, spending anomalies, classifies transactions, and provides personalized suggestions on saving, budgeting, and investing.

---

## 🚀 Features

- 📥 **Upload Bank Statements** (CSV, PDF, or Screenshot)
- 🧠 **LLM-powered Transaction Categorization**
- 📊 **Beautiful Charts**: Balance trend, category breakdowns, and anomaly visualizations
- 🤖 **Smart Insights**:
  - Detects hidden recurring subscriptions
  - Flags unusual debit behavior
  - Highlights high-value outliers
- 🗣️ **Ask & Plan**:
  - Set financial goals
  - Get personalized advice via chat
- 📁 **View & Edit Transactions**
  - Change categories
  - Filter by type, date, and description

---

## 📂 Project Structure

```
FinWizz/
├── backend/               # Python Flask server
│   ├── main.py            # Main app entry point
│   ├── csv_parser.py      # CSV parsing logic
│   ├── pdf_parser.py      # PDF parsing via Camelot/pdfplumber
│   ├── llm_utils.py       # LLM categorization logic
│   ├── anomaly_sub_api.py # Subscription & anomaly detection
│   └── ...                # Other helper files
├── finwizz/               # Next.js frontend
│   ├── app/               # Pages & routes
│   ├── components/        # Reusable components (charts, forms, nav, etc.)
│   └── ...                # Styles, configs, etc.
```

---

## 🛠️ Getting Started

### 🔧 Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies (recommend using virtualenv):
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with the following:
   ```env
   TOGETHER_API_KEY=your_key
   mongo_username=your_username
   mongo_password=your_password
   ```

4. Run the server:
   ```bash
   python main.py
   ```
   The API will run at `http://localhost:5000`.

---

### 🌐 Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd finwizz
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be live at `http://localhost:3000`.

---

## 🧠 Tech Stack

- **Frontend**: React (Next.js), Tailwind CSS, Recharts
- **Backend**: Python Flask, Pandas, MongoDB, Camelot, pdfplumber
- **AI Integration**: Meta LLaMA via Together AI (text + vision)
- **Auth**: Clerk.dev
- **Database**: MongoDB Atlas

---

## 📈 Sample Use Cases

- Detect unrecognized subscriptions like `netflix@okhdfc` or `primevideo@okicici`
- Identify days with large UPI outflows
- Chat with the AI to get budgeting tips like:
  > *"How can I reduce food expenses?"*
- Plan goals like:
  > *"I want to save ₹50k in 6 months"*

---

## 🙌 Acknowledgements

FinWizz uses:
- [Together AI](https://together.ai/)
- [Recharts](https://recharts.org/)
- [Clerk Auth](https://clerk.dev/)
- [MongoDB Atlas](https://www.mongodb.com/atlas)

---

## 📬 Contact

For suggestions, questions or feedback, feel free to reach out to the project maintainers.

---

> Built with ❤️ by CodeBrew to make your money work smarter, not harder.
