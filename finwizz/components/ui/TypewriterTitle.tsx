"use client";
import React, { useEffect, useState } from "react";

const messages = [
  "⚡️Get your financial health score",
  "⚡️Get your financial health report",
  "⚡️Get your financial health analysis",
];

const TypewriterTitle = () => {
  const [text, setText] = useState("");
  const [msgIndex, setMsgIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const currentMsg = messages[msgIndex];
    if (charIndex < currentMsg.length) {
      const timeout = setTimeout(() => {
        setText(currentMsg.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 80);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setText("");
        setCharIndex(0);
        setMsgIndex((msgIndex + 1) % messages.length);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [charIndex, msgIndex]);

  return <span className="italic text-center">{text}|</span>;
};

export default TypewriterTitle;
