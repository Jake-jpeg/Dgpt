"use client";

import { useState, useEffect, useRef } from "react";

interface TypewriterMessageProps {
  content: string;
  speed?: number; // ms per tick
  chunkSize?: number; // chars per tick
  onComplete?: () => void;
}

export default function TypewriterMessage({ content, speed = 8, chunkSize = 3, onComplete }: TypewriterMessageProps) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed("");
    setDone(false);

    if (!content) {
      setDone(true);
      return;
    }

    const interval = setInterval(() => {
      indexRef.current = Math.min(indexRef.current + chunkSize, content.length);
      setDisplayed(content.slice(0, indexRef.current));

      if (indexRef.current >= content.length) {
        clearInterval(interval);
        setDone(true);
        onCompleteRef.current?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, speed, chunkSize]);

  return (
    <p className="whitespace-pre-wrap text-sm">
      {displayed}
      {!done && <span className="inline-block w-0.5 h-4 bg-zinc-400 align-text-bottom animate-pulse ml-0.5" />}
    </p>
  );
}
