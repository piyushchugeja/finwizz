"use client";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

const StatementViewer = ({ refreshKey }) => {
  const { user } = useUser();
  const [uploads, setUploads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStatements = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://127.0.0.1:5000/api/user/${user.id}/statements`);
        const json = await res.json();
        setUploads(json.uploads || []);
        console.log(json);
      } catch (err) {
        console.error("Error fetching statements:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatements();
  }, [user, refreshKey]); // 🔁 triggers on upload

  if (loading) return <p className="text-center mt-4">Loading statements...</p>;

  if (!uploads.length) {
    return <p className="text-center mt-4 text-gray-500">No statements found.</p>;
  }

  return (
    <div className="overflow-x-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">
        Uploaded Statements ({uploads.length})
      </h2>

      {uploads.map((upload, index) => (
        <div
          key={upload._id || index}
          className="mb-10 border border-gray-300 rounded-lg p-4 shadow bg-white"
        >
          <h3 className="text-lg font-semibold text-violet-600 mb-2">
            Upload #{index + 1} • Transactions: {upload.count}
          </h3>

          <table className="min-w-full table-auto text-sm border-collapse">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 text-red-600">Debit (₹)</th>
                <th className="px-4 py-2 text-green-600">Credit (₹)</th>
                <th className="px-4 py-2">Balance</th>
              </tr>
            </thead>
            <tbody>
              {upload.data?.slice(0, 20).map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2">{item.serial}</td>
                  <td className="px-4 py-2">{item.date?.split("T")[0]}</td>
                  <td className="px-4 py-2">{item.description}</td>
                  <td className="px-4 py-2 text-red-600">
                    {item.amount < 0 ? Math.abs(item.amount).toFixed(2) : ""}
                  </td>
                  <td className="px-4 py-2 text-green-600">
                    {item.amount >= 0 ? item.amount.toFixed(2) : ""}
                  </td>
                  <td className="px-4 py-2">{item.balance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="text-sm text-gray-500 mt-2">
            Showing 20 of {upload.count} transactions in this upload.
          </p>
        </div>
      ))}
    </div>
  );
};

export default StatementViewer;
