"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/auth/verify-email?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message);
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push(`/login?message=${encodeURIComponent(data.message)}`);
          }, 3000);
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setMessage("Server error. Please try again later.");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <main className="pt-32 pb-20 px-6 flex justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl text-center border border-slate-100 dark:border-slate-700"
      >
        {status === "loading" && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verifying...</h2>
            <p className="text-slate-600 dark:text-slate-400">Please wait while we confirm your email.</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center text-accent mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Confirmed!</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>
            <p className="text-sm text-slate-400 animate-pulse">Redirecting to login...</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6">
              <XCircle size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Verification Error</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">{message}</p>
            <button 
              onClick={() => router.push("/register")}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:bg-secondary transition-all"
            >
              Back to Registration
            </button>
          </div>
        )}
      </motion.div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <Suspense fallback={
        <main className="pt-32 pb-20 px-6 flex justify-center italic text-slate-400">
          Loading verification tools...
        </main>
      }>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
