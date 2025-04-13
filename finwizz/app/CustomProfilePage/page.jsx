// "use client";
// import { useState } from 'react';
// import Navbar from '../Navbar/page';

// const FinancialProfileForm = () => {
//   const [formData, setFormData] = useState({
//     occupation: '',
//     ageGroup: '',
//     monthlyIncome: '',
//     financialGoal: '',
//     riskAppetite: '',
//   });

//   // Handle change in form fields
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setFormData({
//       ...formData,
//       [name]: value,
//     });
//   };

//   // Handle form submission
//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     console.log('Form data submitted:', formData);
//     // Here you can process the data as required, e.g., save it to the backend.
//   };

//   return (
//     <div className="p-8 bg-white rounded-xl shadow-lg max-w-lg mx-auto mt-6">

//       <h2 className="text-2xl font-semibold mb-6 text-center">Financial Profile Form</h2>
//       <form onSubmit={handleSubmit} className="space-y-6">
//         {/* Occupation Field */}

//         <div>
//           <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
//             Occupation
//           </label>
//           <input
//             type="text"
//             id="occupation"
//             name="occupation"
//             value={formData.occupation}
//             onChange={handleChange}
//             className="mt-1 block w-full p-2 border rounded-md shadow-sm"
//             required
//             placeholder="Enter your occupation"
//           />
//         </div>

//         {/* Age Group Selection */}
//         <div>
//           <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700">
//             Age Group
//           </label>
//           <select
//             id="ageGroup"
//             name="ageGroup"
//             value={formData.ageGroup}
//             onChange={handleChange}
//             className="mt-1 block w-full p-2 border rounded-md shadow-sm"
//             required
//           >
//             <option value="">Select Age Group</option>
//             <option value="18-25">18-25</option>
//             <option value="26-35">26-35</option>
//             <option value="36-45">36-45</option>
//             <option value="46-60">46-60</option>
//             <option value="60+">60+</option>
//           </select>
//         </div>

//         {/* Monthly Income Field */}
//         <div>
//           <label htmlFor="monthlyIncome" className="block text-sm font-medium text-gray-700">
//             Monthly Income (in USD)
//           </label>
//           <input
//             type="number"
//             id="monthlyIncome"
//             name="monthlyIncome"
//             value={formData.monthlyIncome}
//             onChange={handleChange}
//             className="mt-1 block w-full p-2 border rounded-md shadow-sm"
//             required
//             placeholder="Enter your monthly income"
//           />
//         </div>

//         {/* Financial Goal Field */}
//         <div>
//           <label htmlFor="financialGoal" className="block text-sm font-medium text-gray-700">
//             Financial Goal
//           </label>
//           <input
//             type="text"
//             id="financialGoal"
//             name="financialGoal"
//             value={formData.financialGoal}
//             onChange={handleChange}
//             className="mt-1 block w-full p-2 border rounded-md shadow-sm"
//             required
//             placeholder="Enter your financial goal"
//           />
//         </div>

//         {/* Risk Appetite Selection */}
//         <div>
//           <label htmlFor="riskAppetite" className="block text-sm font-medium text-gray-700">
//             Risk Appetite
//           </label>
//           <select
//             id="riskAppetite"
//             name="riskAppetite"
//             value={formData.riskAppetite}
//             onChange={handleChange}
//             className="mt-1 block w-full p-2 border rounded-md shadow-sm"
//             required
//           >
//             <option value="">Select Risk Appetite</option>
//             <option value="low">Low</option>
//             <option value="moderate">Moderate</option>
//             <option value="high">High</option>
//           </select>
//         </div>

//         {/* Submit Button */}
//         <div className="text-center">
//           <button
//             type="submit"
//             className="mt-4 px-6 py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600"
//           >
//             Submit
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default FinancialProfileForm;
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import Navbar from "../components/Navbar";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ReactMarkdown from "react-markdown";
import Together from "together-ai";

const together = new Together({
  apiKey: process.env.NEXT_PUBLIC_TOGETHER_API_KEY,
});

const SummaryChatPage = () => {
  const { user } = useUser();
  const [transactions, setTransactions] = useState([]);
  const [insights, setInsights] = useState(null);
  const [goal, setGoal] = useState("");
  const [chat, setChat] = useState("");
  const [riskAppetite, setRiskAppetite] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTxns = async () => {
      const res = await fetch(`http://localhost:5000/api/user/${user.id}/statements`);
      const data = await res.json();
      const flat = data.uploads.flatMap(upload => upload.data.map(txn => ({ ...txn, uploadId: upload._id })));
      setTransactions(flat);

      const firstWithInsights = data.uploads.find(upload => upload.insights);
      if (firstWithInsights) setInsights(firstWithInsights.insights);
    };
    if (user) fetchTxns();
  }, [user]);

  const handleChat = async () => {
    if (!chat && !goal) return toast("Enter a goal or question to begin");

    setLoading(true);
    setResponse(null);

    const formatted = transactions
      .slice(0, 100)
      .map(txn => `- ${txn.date.split("T")[0]} | ${txn.description} | Rs.${txn.amount}`)
      .join("\n");

    const prompt = `You are a smart financial advisor. The following is a user's recent transaction history:\n\n${formatted}\n\nThe user has asked:\n${goal ? `My goal is to ${goal}.` : ""} and their risk appetite is ${riskAppetite}\n${chat ? `Question: ${chat}` : ""}\n\nProvide budgeting tips, cost-cutting suggestions, investment ideas (consider their risk appetite as well), and a path to reach their goal in a non-overwhelming manner, neatly and use their transaction history to provide examples of overspending, wastage of money, etc.. Be concise, helpful, and tailored to their habits. Provide the output formatted using markdown for better readability, use bullet points and even table if required.`;

    try {
      const res = await together.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo-classifier",
        temperature: 0.7,
        maxTokens: 500,
        topP: 1,
      });

      setResponse(res.choices[0].message.content);
    } catch (err) {
      console.error("Together AI error:", err);
      toast.error("Failed to get response from AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 to-indigo-100">
      <Navbar />
      <div className="pt-6 px-6 md:px-16 pb-20">
        <h1 className="text-3xl font-bold text-violet-900 mb-4">💡 Smart Financial Summary</h1>
        <p className="text-gray-600 mb-6 max-w-3xl">
          Based on your transaction history, we'll help you understand your spending patterns and give personalized saving, budgeting, and investing advice.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <Card className="p-4 space-y-2">
              <label className="font-semibold">Set a Financial Goal</label>
              <Input value={goal} onChange={e => setGoal(e.target.value)} placeholder="e.g., Save 50k in 6 months" />
            </Card>

            {/* Ask for user's risk appetite */}
            <Card className="p-4 space-y-2">
              <label className="font-semibold">Risk Appetite</label>
              <select value={riskAppetite} onChange={e => setRiskAppetite(e.target.value)} className="w-full p-2 border rounded-md shadow-sm">
                <option value="">Select Risk Appetite</option>
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </Card>

            <Card className="p-4 space-y-2">
              <label className="font-semibold">Ask a Question</label>
              <Textarea
                value={chat}
                onChange={e => setChat(e.target.value)}
                placeholder="e.g., How can I reduce monthly expenses?"
                rows={4}
              />
              <Button onClick={handleChat} className="w-full mt-2" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Get Advice"}
              </Button>
            </Card>
          </div>

          <div className="md:col-span-2 bg-white rounded-xl shadow p-6 space-y-4">
            <h2 className="text-xl font-semibold text-indigo-800 mb-2">📊 Advisor Insights</h2>
            {response ? (
              <div className="prose prose-indigo max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {response}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Ask a question or set a goal to get your personalized guidance.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default SummaryChatPage;