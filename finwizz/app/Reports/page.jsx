"use client";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import html2pdf from "html2pdf.js";
import "chart.js/auto";

const Reports = () => {
  const { user } = useUser();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://127.0.0.1:5000/api/user/${user.id}/statements`);
        const json = await res.json();
        setUploads(json.uploads || []);
      } catch (err) {
        console.error("Failed to fetch reports:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) return <p className="text-center mt-6">Loading report...</p>;
  if (!uploads.length) return <p className="text-center mt-6 text-gray-500">No data available.</p>;

  const allData = uploads.flatMap(u => u.data);

  const spendingByCategory = {};
  const earningsByMonth = {};
  const expensesByMonth = {};
  const recurringPayments = {};
  const anomalies = [];

  let totalDebit = 0;
  let totalCredit = 0;

  const normalizeDescription = desc => desc.toLowerCase().replace(/[^a-z]/g, "");

  allData.forEach(entry => {
    const { amount, category, date, description } = entry;
    const month = new Date(date).toLocaleString("default", { month: "short", year: "numeric" });

    if (amount < 0) {
      spendingByCategory[category] = (spendingByCategory[category] || 0) + Math.abs(amount);
      expensesByMonth[month] = (expensesByMonth[month] || 0) + Math.abs(amount);
      totalDebit += Math.abs(amount);
    } else {
      earningsByMonth[month] = (earningsByMonth[month] || 0) + amount;
      totalCredit += amount;
    }

    if (/netflix|prime|hotstar|spotify|subscription|recurring|monthly/i.test(description)) {
      const key = normalizeDescription(description);
      if (!recurringPayments[key]) {
        recurringPayments[key] = {
          label: description,
          count: 0,
          total: 0,
        };
      }
      recurringPayments[key].count += 1;
      recurringPayments[key].total += Math.abs(amount);
    }

    if (amount < 0 && (Math.abs(amount) > 50000 || amount === 0)) {
      anomalies.push(entry);
    }
  });

  uploads.forEach(upload => {
    if (upload.insights?.anomalies?.length) {
      upload.insights.anomalies.forEach(anomaly => {
        if (anomaly.amount < 0) {
          anomalies.push(anomaly);
        }
      });
    }
  });

  const topCategories = Object.entries(spendingByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const barData = {
    labels: Object.keys(earningsByMonth),
    datasets: [
      {
        label: "Earnings",
        backgroundColor: "rgba(34,197,94,0.6)",
        data: Object.values(earningsByMonth),
      },
      {
        label: "Expenses",
        backgroundColor: "rgba(239,68,68,0.6)",
        data: Object.values(expensesByMonth),
      },
    ],
  };

  const pieData = {
    labels: topCategories.map(([cat]) => cat),
    datasets: [
      {
        label: "Spending",
        data: topCategories.map(([, val]) => val),
        backgroundColor: ["#facc15", "#38bdf8", "#ec4899", "#34d399", "#f87171"],
      },
    ],
  };

  const generatePDF = () => {
    const element = document.getElementById("report-preview");

    html2pdf()
      .from(element)
      .set({
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .save("financial_report.pdf");
  };

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-800">📊 Financial Report</h1>
        <button
          onClick={generatePDF}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Download PDF
        </button>
      </div>

      <div id="report-preview" className="space-y-10 bg-white shadow rounded-lg p-6">
        {/* 💡 Key Metrics */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">💡 Key Financial Metrics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <h3 className="text-green-700 text-lg font-semibold">Total Earnings</h3>
              <p className="text-2xl font-bold text-green-900">₹{totalCredit.toFixed(2)}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <h3 className="text-red-700 text-lg font-semibold">Total Expenses</h3>
              <p className="text-2xl font-bold text-red-900">₹{totalDebit.toFixed(2)}</p>
            </div>
            <div className={`p-4 rounded-lg text-center ${totalCredit - totalDebit >= 0 ? "bg-green-100" : "bg-red-100"}`}>
              <h3 className={`text-lg font-semibold ${totalCredit - totalDebit >= 0 ? "text-green-700" : "text-red-700"}`}>
                Net Balance
              </h3>
              <p className={`text-2xl font-bold ${totalCredit - totalDebit >= 0 ? "text-green-900" : "text-red-900"}`}>
                ₹{(totalCredit - totalDebit).toFixed(2)}
              </p>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg text-center">
              <h3 className="text-yellow-700 text-lg font-semibold">Recurring Payments</h3>
              <p className="text-2xl font-bold text-yellow-900">{Object.keys(recurringPayments).length}</p>
            </div>
          </div>
        </div>
        {/* 📈 Financial Health Visualizations */}
{/* 📈 Financial Health Visualizations */}
<div className="bg-white p-6 rounded-2xl shadow-md space-y-6">
  <h2 className="text-2xl font-bold text-gray-800">📈 Financial Health Insights</h2>

  {/* Spending vs Income */}
  <div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">💸 Spending vs Income</h3>
    
    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>Total Income: ₹{totalCredit}</span>
      <span>Total Spending: ₹{totalDebit}</span>
    </div>

    <div className="w-full bg-gray-200 rounded-full h-6 relative">
      <div
        className={`h-6 rounded-full ${
          totalDebit <= totalCredit ? "bg-green-500" : "bg-red-500"
        } transition-all duration-500`}
        style={{
          width: `${Math.min((totalDebit / totalCredit) * 100, 100)}%`,
        }}
      ></div>
    </div>

    <p className={`mt-2 text-sm ${
      totalDebit <= totalCredit ? "text-green-700" : "text-red-600"
    }`}>
      {totalDebit <= totalCredit
        ? "✅ You are spending within your income."
        : "⚠️ You are overspending beyond your income!"}
    </p>
  </div>

  {/* Savings Rate */}
  <div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">💰 Savings Rate</h3>

    <div className="flex justify-between text-sm text-gray-600 mb-1">
      <span>Savings: ₹{(totalCredit - totalDebit).toFixed(2)}</span>
      <span>Target: {(totalCredit * 0.20).toFixed(2)} (20%)</span>
    </div>

    <div className="w-full bg-gray-200 rounded-full h-6 relative">
      <div
        className="h-6 bg-blue-500 rounded-full transition-all duration-500"
        style={{
          width: `${((totalCredit - totalDebit) / totalCredit) * 100}%`,
        }}
      ></div>
    </div>

    <p className="mt-2 text-sm text-blue-700">
      Savings Rate: <strong>{(((totalCredit - totalDebit) / totalCredit) * 100).toFixed(1)}%</strong>
      {((totalCredit - totalDebit) / totalCredit) < 0.2
        ? " (Below recommended 20%) ⚠️"
        : " (Good!) ✅"}
    </p>
  </div>

  {/* Rarely Used Subscriptions */}
  <div>
    <h3 className="text-lg font-semibold text-gray-700 mb-2">📦 Rarely Used Subscriptions</h3>
    {Object.values(recurringPayments).filter(sub => sub.count <= 2).length ? (
      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
        {Object.entries(recurringPayments)
          .filter(([_, sub]) => sub.count <= 2)
          .map(([_, sub], i) => (
            <li key={i}>
              <span className="font-medium text-gray-800">{sub.label}</span> • ₹{sub.total.toFixed(2)} 
              <span className="text-gray-500"> ({sub.count} time{sub.count > 1 ? "s" : ""})</span>
            </li>
          ))}
      </ul>
    ) : (
      <p className="text-sm text-gray-500">No rarely used subscriptions found.</p>
    )}
  </div>
</div>


        {/* Rest of the report continues... */}
        {/* 🧾 Summary */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Transaction Summary</h2>
          <p className="text-gray-700 text-sm leading-relaxed">
            A total of <span className="font-medium">{allData.length}</span> transactions were recorded.
            The total amount spent (debit) is{" "}
            <span className="text-red-600 font-medium">₹{totalDebit.toFixed(2)}</span> and the total
            received (credit) is{" "}
            <span className="text-green-600 font-medium">₹{totalCredit.toFixed(2)}</span>. Net balance
            change:{" "}
            <span
              className={`font-medium ${
                totalCredit - totalDebit >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ₹{(totalCredit - totalDebit).toFixed(2)}
            </span>.
          </p>
        </div>

        {/* 🍕 Pie Chart */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Top 5 Spending Categories</h2>
          <div className="w-64 mx-auto">
            <Pie data={pieData} options={{ maintainAspectRatio: false }} height={200} />
          </div>
        </div>

        {/* 📊 Bar Chart */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Monthly Earnings vs Expenses</h2>
          <div className="w-full max-w-2xl mx-auto">
            <Bar data={barData} options={{ maintainAspectRatio: false }} height={250} />
          </div>
        </div>

        {/* 🔁 Recurring Payments */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Recurring Payments</h2>
          {Object.keys(recurringPayments).length ? (
            <ul className="list-disc list-inside text-gray-700">
              {Object.entries(recurringPayments).map(([_, { label, count, total }], idx) => (
                <li key={idx}>
                  {label} • <span className="text-sm text-gray-500">({count} times, ₹{total.toFixed(2)})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No recurring payments detected.</p>
          )}
        </div>

        {/* 🚨 Anomalies */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Anomalies</h2>
          {anomalies.length ? (
            <table className="w-full table-auto text-sm border mt-2">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-2 py-1">Date</th>
                  <th className="px-2 py-1">Amount</th>
                  <th className="px-2 py-1">Description</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{item.date?.split("T")[0]}</td>
                    <td className="px-2 py-1">₹{Math.abs(item.amount).toFixed(2)}</td>
                    <td className="px-2 py-1">{item.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-gray-500">No major debit anomalies found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
