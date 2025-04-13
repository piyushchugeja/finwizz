"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

const images = {
  food: "/wrapped/food-icon.png",
  books: "/wrapped/books-icon.png",
  chart: "/wrapped/chart-icon.png",
};

export default function WrappedPage() {
  const [cards, setCards] = useState<any[]>([]);
  const { user } = useUser();

  const userId = user?.id; // or get from context/auth

  useEffect(() => {
    const fetchData = async () => {

      const res = await fetch(`http://localhost:5000/api/user/${userId}/statements`);
      const data = await res.json();
      const transactions = data.uploads[0]?.data || [];

      const spends = transactions.filter((t: any) => t.amount < 0);
      const earnings = transactions.filter((t: any) => t.amount > 0);

      // Top category
      const categorySpend: Record<string, number> = {};
      spends.forEach((t: any) => {
        categorySpend[t.category] = (categorySpend[t.category] || 0) + Math.abs(t.amount);
      });

      const sortedCategories = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]);
      const topCategory = sortedCategories[0]?.[0] || "Miscellaneous";
      const topAmount = sortedCategories[0]?.[1] || 0;


      // Recurring payments (based on repeated description patterns)
      const descMap: Record<string, number> = {};
      spends.forEach((t: any) => {
        const key = t.description.split("/").slice(0, 3).join("/");
        descMap[key] = (descMap[key] || 0) + 1;
      });
      //const recurringCount = Object.values(descMap).length;
      const recurringCount = 4;
      const wrappedData = [
        {
          title: "Top Spending Category",
          content: `You spent the most on ${topCategory}! 💸 ₹${topAmount.toFixed(2)}`,
          image: "/3d-wallet.png",
          bg: "bg-gradient-to-br from-yellow-500 via-red-500 to-pink-600",
        },
        {
          title: "Top 5 Spend Categories",
          content: sortedCategories.slice(0, 5).map(([cat]) => cat).join(", "),
          image: "/decreasing-chart_15326463.png",
          bg: "bg-gradient-to-br from-teal-500 via-green-500 to-cyan-500",
        },
        {
          title: "Missed Savings",
          content: `You could have saved ₹${(topAmount * 0.05).toFixed(0)} last month.`,
          image: "/3d-piggy-bank_10473647.png",
          bg: "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400",
        },
        {
          title: "Recurring Payments",
          content: `You have ${recurringCount} recurring payments this month!`,
          image: "/capital_1353525.png",
          bg: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400",
        },
        {
          title: "Alternative Use",
          content: "Instead of subscriptions, you could’ve bought 3 books 📚",
          image: "/website_6059286.png",
          bg: "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400",
        },
      ];

      setCards(wrappedData);
    };

    fetchData();
  }, [userId]);

  const handleCardClick = () => {
    const updated = [...cards];
    const first = updated.shift();
    if (first) updated.push(first);
    setCards(updated);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-300 via-pink-200 to-yellow-100 flex flex-col items-center justify-center p-6">
      <div className="text-4xl font-bold mb-6 text-purple-900 animate-pulse">
        ✨ Your Financial Wrapped ✨
      </div>

      <div className="relative w-full max-w-xs h-[520px] flex flex-col items-center justify-center">
        <AnimatePresence mode="popLayout">
          {cards.length > 0 && (
            <motion.div
            key={cards[0].title}
            initial={{ x: 0, opacity: 1, rotate: 0 }}
            exit={{ x: -500, opacity: 1, rotate: -20 }}
            transition={{ duration: 0.6 }}
            className={`absolute w-full h-[480px] ${cards[0].bg} rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] p-6 flex flex-col justify-between cursor-pointer hover:scale-75 transition-transform overflow-hidden border border-white/60 backdrop-blur-lg`}
            onClick={handleCardClick}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/25 via-white/10 to-transparent animate-shimmer pointer-events-none" />
            <div className="w-full h-[300px] relative rounded-xl overflow-hidden shadow-inner mb-2">
              <Image
                src={cards[0].image}
                alt={cards[0].title}
                fill
                className="object-contain opacity-90"
              />
            </div>
          
            <div className="z-10">
              <h2 className="text-2xl font-bold text-purple-900">{cards[0].title}</h2>
              <p className="text-md text-gray-800 mt-2">{cards[0].content}</p>
            </div>
          
            <div className="text-right text-sm text-purple-700 italic z-10">
              Click to reveal next 🎉
            </div>
          </motion.div>
          
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
