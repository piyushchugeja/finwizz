"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

const StatsCard = () => {
  const { user } = useUser();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchSummary = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/user/${user.id}/summary`);
        const data = await res.json();
        setSummary(data.summary);
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };

    fetchSummary();
  }, [user]);

  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6 w-full max-w-6xl">
      <StatBox label="Total Debit" value={`₹${summary.total_debit.toLocaleString()}`} color="text-red-600" />
      <StatBox label="Total Credit" value={`₹${summary.total_credit.toLocaleString()}`} color="text-green-600" />
      <StatBox label="Savings" value={`₹${(summary.total_credit - summary.total_debit).toLocaleString()}`} color="text-blue-600" />
      <StatBox label="Transactions" value={summary.total_transactions} color="text-indigo-600" />
      <StatBox label="Uploads" value={summary.total_uploads} color="text-yellow-600" />
    </div>
  );
};

const StatBox = ({ label, value, color }) => (
  <div className="bg-white shadow rounded-xl p-6 text-center">
    <div className={`text-xl font-bold ${color}`}>{value}</div>
    <div className="text-gray-500 mt-1">{label}</div>
  </div>
);

export default StatsCard;