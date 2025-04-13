"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Brush,
  Scatter,
  Legend,
  ReferenceLine
} from "recharts";
import { useUser } from "@clerk/nextjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Together from "together-ai";

const COLORS = [
  "#8884d8", "#82ca9d", "#ffc658", "#ff7f50",
  "#8dd1e1", "#a4de6c", "#d0ed57", "#f56991",
];

const together = new Together({
  apiKey: process.env.NEXT_PUBLIC_TOGETHER_API_KEY,
});

const SummaryCards = () => {
  const { user } = useUser();
  const [categoryData, setCategoryData] = useState([]);
  const [balanceData, setBalanceData] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [insights, setInsights] = useState(null);
  const [allTxns, setAllTxns] = useState([]);
  const [dailyDebits, setDailyDebits] = useState([]);
  const [threshold, setThreshold] = useState(null);
  const [balanceExplanation, setBalanceExplanation] = useState("");
  const [categoryExplanation, setCategoryExplanation] = useState("");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [loadingCategory, setLoadingCategory] = useState(false);

  const handleExplain = async (type) => {
    if (type === "balance") {
      setLoadingBalance(true);
      const explanation = await explainChart("balance", balanceData);
      setBalanceExplanation(explanation);
      setLoadingBalance(false);
    } else if (type === "category") {
      setLoadingCategory(true);
      const explanation = await explainChart("category", categoryData);
      setCategoryExplanation(explanation);
      setLoadingCategory(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/user/${user.id}/statements`);
        const data = await res.json();

        const txns = data.uploads.flatMap(upload => upload.data);
        txns.sort((a, b) => new Date(a.date) - new Date(b.date));

        const firstWithInsights = data.uploads.find(upload => upload.insights);
        if (firstWithInsights) setInsights(firstWithInsights.insights);

        if (!startDate && !endDate && txns.length) {
          setStartDate(new Date(txns[0].date));
          setEndDate(new Date(txns[txns.length - 1].date));
        }

        setAllTxns(txns);
      } catch (err) {
        console.error("Error fetching statements:", err);
      }
    };

    if (user) fetchData();
  }, [user]);

  const explainChart = async (type, data) => {
    const formatted = data
      .map(d => `${type === "balance" ? `${d.date}: ₹${d.balance.toFixed(2)}` : `${d.name}: ₹${d.value.toFixed(2)}`}`)
      .join("\n");

    const prompt = `
    You are a financial assistant. Analyze the following ${type === "balance" ? "balance trend over time" : "category-wise spending"} data and explain it simply to a user.
    
    Data:
    ${formatted}
    
    Respond with a short and clear explanation that summarizes key trends, highlights peaks or anomalies, and suggests what it might mean for the user.
    Return your response in HTML, with <p> tags for paragraphs and <strong> for important points.
    Use simple language and avoid technical jargon.
      `;

    try {
      const response = await together.chat.completions.create({
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo-classifier",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      });
      return response.choices[0].message.content.trim();
    } catch (err) {
      console.error("LLM error:", err);
      return "Sorry, couldn't generate an explanation right now.";
    }
  };

  useEffect(() => {
    if (!allTxns.length || !startDate || !endDate) return;

    const filtered = allTxns.filter(txn => {
      const txnDate = new Date(txn.date);
      return txnDate >= startDate && txnDate <= endDate;
    });

    const categoryTotals = {};
    const balanceTimeSeries = {};
    const dailyDebitMap = {};
    let runningBalance = 0;

    filtered.forEach(txn => {
      const dateStr = txn.date.split("T")[0];
      const amt = txn.amount;
      const cat = txn.category || "Uncategorized";

      if (amt < 0) {
        categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(amt);
        dailyDebitMap[dateStr] = (dailyDebitMap[dateStr] || 0) + Math.abs(amt);
      }

      runningBalance += amt;
      balanceTimeSeries[dateStr] = runningBalance;
    });

    const categoryChart = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
    const balanceChart = Object.entries(balanceTimeSeries).map(([date, balance]) => ({ date, balance }));
    const debitChart = Object.entries(dailyDebitMap).map(([date, total_debit]) => ({ date, total_debit }));

    const debitValues = debitChart.map(d => d.total_debit);
    const calculatedThreshold = Math.max(...debitValues) * 0.75; // Optional tweak

    setCategoryData(categoryChart);
    setBalanceData(balanceChart);
    setDailyDebits(debitChart);
    setThreshold(calculatedThreshold);
  }, [allTxns, startDate, endDate]);

  const anomalyPoints = insights?.daily_anomalies?.map(row => ({
    date: new Date(row["Value Date"]).toISOString().split("T")[0],
    total_debit: row.total_debit
  })) ?? [];

  return (
    <div className="w-full p-6 space-y-10">
      {/* Date range filter */}
      <div className="flex flex-col md:flex-row items-center gap-4">
        <label className="font-medium text-gray-700">Filter by Date Range:</label>
        <div className="flex items-center gap-2">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dateFormat="yyyy-MM-dd"
          />
          <span className="mx-2 text-gray-500">to</span>
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            dateFormat="yyyy-MM-dd"
          />
        </div>
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Balance Line Chart */}
        <div className="lg:col-span-3 bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Balance Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={balanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="balance" stroke="#8884d8" strokeWidth={2} dot={false} />
              <Brush dataKey="date" height={20} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
          <button
            onClick={() => handleExplain("balance")}
            disabled={loadingBalance}
            className={`mt-4 px-4 py-2 rounded text-white ${loadingBalance ? "bg-gray-400" : "bg-indigo-500 hover:bg-indigo-600"}`}
          >
            {loadingBalance ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              "Explain this chart"
            )}
          </button>
          {/* Explanation Text */}
          {balanceExplanation && (
            <p className="mt-4 p-4 bg-indigo-50 rounded text-gray-800 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: balanceExplanation }}>
              {/* {balanceExplanation} */}
            </p>
          )}
        </div>

        {/* Category Pie Chart */}
        <div className="lg:col-span-2 bg-white shadow-lg rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Category-wise Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={(() => {
                  const total = categoryData.reduce((sum, { value }) => sum + value, 0);
                  const groupedData = categoryData.reduce((acc, entry) => {
                    const percentage = (entry.value / total) * 100;
                    if (percentage < 5) {
                      const others = acc.find((item) => item.name === "Others");
                      if (others) {
                        others.value += entry.value;
                      } else {
                        acc.push({ name: "Others", value: entry.value });
                      }
                    } else {
                      acc.push(entry);
                    }
                    return acc;
                  }, []);
                  return groupedData;
                })()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <button
            onClick={() => handleExplain("category")}
            disabled={loadingCategory}
            className={`mt-4 px-4 py-2 rounded text-white ${loadingCategory ? "bg-gray-400" : "bg-indigo-500 hover:bg-indigo-600"}`}
          >
            {loadingCategory ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
            ) : (
              "Explain this chart"
            )}
          </button>
          {/* Explanation Text */}
          {categoryExplanation && (
            <p className="mt-4 p-4 bg-indigo-50 rounded text-gray-800 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: categoryExplanation }}>
              {/* {categoryExplanation} */}
            </p>
          )}
        </div>
      </div>

      {/* Daily Debits with Anomalies Chart */}
      {dailyDebits.length > 0 && (
        <div className="bg-white mt-12 rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-rose-600 mb-4">💸 Daily Debit Pattern with Anomaly Detection</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyDebits}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total_debit" stroke="#1e3a8a" strokeWidth={2} />
              <ReferenceLine y={threshold} stroke="orange" strokeDasharray="5 5" label={`Threshold (${threshold?.toFixed(0)})`} />
              <Scatter data={anomalyPoints} fill="#111827" name="Anomalies" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-sm text-gray-600 mt-4">
            This chart shows daily debit totals. Points in black indicate detected anomalies based on spending spikes.
          </p>
        </div>
      )}

      {/* Hidden Subscriptions Data */}
      {insights?.hidden_subscriptions?.length > 0 && (
        <div className="bg-white shadow-lg rounded-2xl p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">💳 Hidden Subscriptions</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
            {insights.hidden_subscriptions.map((sub, idx) => (
              <li key={idx}>
                {sub.handle} — ₹{sub.amount} monthly × {sub.transactions.length} times
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SummaryCards;