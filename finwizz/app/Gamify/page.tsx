"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Progress } from "@mantine/core";
import { motion } from "framer-motion";
import { Sparkles, Trophy, Scissors } from "lucide-react";

export default function GamifyTab() {
  const { user } = useUser();
  const [goalProgress, setGoalProgress] = useState(0);
  const [recurringCutbacks, setRecurringCutbacks] = useState(0);
  const [iqScore, setIqScore] = useState(0);

  useEffect(() => {
    const fetchGamifyData = async () => {
      if (!user) return;

      const res = await fetch(`http://localhost:5000/api/user/${user.id}/insights`);
      const data = await res.json();

      const totalRecurringSpend = data.recurring.reduce((sum: number, item: any) => sum + Math.abs(item.amount), 0);
      const goal = 2000; // monthly savings goal
      const actualSavings = data.savingsEstimate || 800;
      const progressPercent = Math.min((actualSavings / goal) * 100, 100);

      setGoalProgress(progressPercent);
      setRecurringCutbacks(data.recurring.length);
      setIqScore(50 + Math.min(actualSavings / 10, 50)); // max 100
    };

    fetchGamifyData();
  }, [user]);

  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
      <motion.div
        className="rounded-2xl bg-gradient-to-br from-green-200 via-green-100 to-white p-5 shadow-lg"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center gap-3 text-green-900 font-semibold text-lg mb-2">
          <Trophy className="w-5 h-5" />
          Savings Goal Tracker
        </div>
        <div className="text-sm mb-1">Target: ₹2000 • Saved so far: ₹{((goalProgress / 100) * 2000).toFixed(0)}</div>
        <Progress value={goalProgress} color="green" radius="xl" size="lg" striped animated />
        </motion.div>

      <motion.div
        className="rounded-2xl bg-gradient-to-br from-rose-200 via-pink-100 to-white p-5 shadow-lg"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center gap-3 text-pink-900 font-semibold text-lg mb-2">
          <Scissors className="w-5 h-5" />
          Recurring Spend Challenge
        </div>
        <p className="text-sm text-gray-800">
          You cut down on <strong>{recurringCutbacks}</strong> recurring spends this month! ✂️
        </p>
        <p className="text-xs text-gray-500 mt-1">Every cutback = more saved. Keep going!</p>
      </motion.div>

      <motion.div
        className="rounded-2xl bg-gradient-to-br from-indigo-200 via-violet-100 to-white p-5 shadow-lg"
        whileHover={{ scale: 1.02 }}
      >
        <div className="flex items-center gap-3 text-indigo-900 font-semibold text-lg mb-2">
          <Sparkles className="w-5 h-5" />
          Financial IQ Score
        </div>
        <p className="text-4xl font-bold text-indigo-800">{Math.round(iqScore)}</p>
        <p className="text-sm text-gray-700 mt-1">Your score reflects smart choices & savings! 💡</p>
      </motion.div>
    </div>
  );
}
