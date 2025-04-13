"use client";
import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import StatementViewer from "../components/StatementViewer";
import UploadForm from "../components/UploadForm";
import Navbar from "../components/Navbar";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import SummaryCards from "../components/SummaryCards";

const Dashboard = () => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [showStatements, setShowStatements] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/");
    } else {
      fetchStatements();
    }
  }, [isLoaded, user]);

  const fetchStatements = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/user/${user.id}/statements`);
      const json = await res.json();
      const allTxns = json.uploads.flatMap((upload) => upload.data || []);
      setTransactions(allTxns);
    } catch (error) {
      console.error("Error fetching statements:", error);
    }
  };

  const totalIncome = transactions
    .filter(txn => txn.amount > 0)
    .reduce((acc, txn) => acc + txn.amount, 0);

  const totalExpense = transactions
    .filter(txn => txn.amount < 0)
    .reduce((acc, txn) => acc + txn.amount, 0);

  const netSavings = totalIncome + totalExpense;

  const chartData = Object.values(
    transactions.reduce((acc, txn) => {
      const date = txn.date?.split("T")[0];
      if (!acc[date]) acc[date] = { date, income: 0, expense: 0 };
      if (txn.amount >= 0) acc[date].income += txn.amount;
      else acc[date].expense += Math.abs(txn.amount);
      return acc;
    }, {})
  ).slice(0, 7); // Recent 7 days

  const handleSignOut = () => {
    signOut();
    router.push("/sign-in");
  };

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-r from-amber-100 to-indigo-200">
      {/* Sign-Out & Profile Buttons */}
      <Navbar/>
      <div className="absolute top-4 right-4 flex gap-3 items-center">
        <UserButton />
        <Link href="/user-profile">
          <button className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded">
            View Profile
          </button>
        </Link>
        <button
          onClick={handleSignOut}
          className="bg-red-500 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-full"
        >
          Sign Out
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center px-4">
        <h1 className="text-3xl font-bold text-violet-800 mb-6">
          Hello, welcome to your Dashboard!
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
            <p className="text-gray-500">Income</p>
            <h2 className="text-xl font-semibold text-green-600">₹ {totalIncome.toFixed(2)}</h2>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-500">
            <p className="text-gray-500">Expenses</p>
            <h2 className="text-xl font-semibold text-red-600">₹ {Math.abs(totalExpense).toFixed(2)}</h2>
          </div>
          <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
            <p className="text-gray-500">Net Savings</p>
            <h2 className={`text-xl font-semibold ${netSavings >= 0 ? "text-blue-600" : "text-red-600"}`}>
              ₹ {netSavings.toFixed(2)}
            </h2>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full max-w-4xl bg-white rounded-xl shadow p-6 mb-10">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Income vs Expenses (Recent Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" fill="#22c55e" name="Income" />
              <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upload Form */}
        <UploadForm />


        {/* Toggle Button */}
        <button
          onClick={() => setShowStatements(prev => !prev)}
          className="mt-6 bg-indigo-600 hover:bg-indigo-800 text-white font-semibold py-2 px-6 rounded-full"
        >
          {showStatements ? "Hide My Statements" : "View My Statements"}
        </button>

        {/* Statement Viewer */}
        {showStatements && <StatementViewer />}
      </div>
    </div>
  );
};

export default Dashboard;
