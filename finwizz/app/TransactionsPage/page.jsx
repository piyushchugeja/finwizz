"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";

const categoryOptions = ["Salary", "Food", "Travel", "Shopping", "Subscriptions", "Utilities", "Transfers", "Wallets", "Rent", "Health", "Education", "Entertainment", "Miscellaneous"];

const TransactionsPage = () => {
  const { user } = useUser();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const fetchTxns = async () => {
      const res = await fetch(`http://localhost:5000/api/user/${user.id}/statements`);
      const data = await res.json();
      const flatData = data.uploads.flatMap(upload =>
        upload.data.map(txn => ({ ...txn, uploadId: upload._id }))
      );
      const subscriptions = [];
      for (const upload of data.uploads) {
        if (upload.insights?.hidden_subscriptions) {
          subscriptions.push(...upload.insights.hidden_subscriptions);
        }
      }
      setRecurring(subscriptions);

      setTransactions(flatData);
      setFiltered(flatData);
    };
    if (user) fetchTxns();
  }, [user]);

  useEffect(() => {
    let temp = [...transactions];

    if (search) {
      temp = temp.filter(txn => txn.description.toLowerCase().includes(search.toLowerCase()));
    }
    if (startDate && endDate) {
      temp = temp.filter(txn => {
        const date = new Date(txn.date);
        return date >= startDate && date <= endDate;
      });
    }
    if (filterType !== "all") {
      temp = temp.filter(txn => (filterType === "debit" ? txn.amount < 0 : txn.amount > 0));
    }
    if (categoryFilter !== "all") {
      temp = temp.filter(txn => txn.category === categoryFilter);
    }

    setFiltered(temp);
  }, [search, startDate, endDate, filterType, categoryFilter, transactions]);

  const handleCategoryChange = async (uploadId, date, description, newCategory) => {
    const confirmed = confirm(`Are you sure you want to change this category to ${newCategory}?`);
    if (!confirmed) return;

    try {
      const res = await fetch("http://localhost:5000/api/transaction/update-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, date, description, category: newCategory })
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("Category updated!");

        // ✅ Update the local state to reflect the change instantly
        const updatedTxns = transactions.map(txn => {
          if (txn.uploadId === uploadId && txn.date === date && txn.description === description) {
            return { ...txn, category: newCategory };
          }
          return txn;
        });

        setTransactions(updatedTxns); // will auto-refresh filtered too
      } else {
        toast.error(result.error || "Failed to update");
      }
    } catch (err) {
      toast.error("Error updating category");
    }
  };


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />

      <div className="flex flex-col md:flex-row p-6 gap-6">
        {/* Sidebar filters */}
        <div className="w-full md:w-1/4 p-4 space-y-4 mt-10 position-sticky top-0">
          <h2 className="text-lg font-semibold text-indigo-700">Filters</h2>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search description..."
            className="w-full p-2 border rounded"
          />
          <div>
            <label className="block mb-1 font-medium">Start Date</label>
            <DatePicker selected={startDate} onChange={setStartDate} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">End Date</label>
            <DatePicker selected={endDate} onChange={setEndDate} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Type</label>
            <select className="w-full p-2 border rounded" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All</option>
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Category</label>
            <select className="w-full p-2 border rounded" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All</option>
              {categoryOptions.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="flex-1 bg-white shadow-lg rounded-xl p-4 overflow-x-auto">
          <h2 className="text-2xl font-bold mb-4">Your Transactions</h2>
          <table className="w-full text-sm text-left">
            <thead className="bg-indigo-100 text-indigo-800">
              <tr>
                <th className="p-2">#</th>
                <th className="p-2">Date</th>
                <th className="p-2">Description</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Category</th>
                <th className="p-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((txn, idx) => (
                <tr key={idx} className="even:bg-gray-50">
                  <td className="p-2">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td className="p-2">{new Date(txn.date).toLocaleDateString()}</td>
                  <td className="p-2 max-w-xs truncate" title={txn.description}>{txn.description}</td>
                  <td className={`p-2 ${txn.amount < 0 ? "text-red-600" : "text-green-600"}`}>{txn.amount.toFixed(2)}</td>
                  <td className="p-2">
                    <select
                      value={txn.category || "Uncategorized"}
                      onChange={(e) => handleCategoryChange(txn.uploadId, txn.date, txn.description, e.target.value)}
                      className="border p-1 rounded"
                    >
                      <option disabled>Change Category</option>
                      {categoryOptions.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                    </select>
                  </td>
                  <td className="p-2">{txn.balance ? txn.balance.toFixed(2) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-indigo-500 text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>

          {/* Recurring Transactions / Subscriptions */}
          {recurring.length > 0 && (
            <div className="mt-10">
              <h3 className="text-xl font-semibold text-indigo-700 mb-2">📆 Recurring Transactions (Subscriptions)</h3>
              <div className="grid gap-4">
                {recurring.map((sub, index) => (
                  <div key={index} className="bg-indigo-50 p-4 rounded shadow">
                    <p className="font-semibold mb-1">{sub.handle} — ₹{sub.amount}</p>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {sub.transactions.map((txn, i) => (
                        <li key={i}>
                          {new Date(txn["Value Date"]).toLocaleDateString()} — {txn.Description}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default TransactionsPage;