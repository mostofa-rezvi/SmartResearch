"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/lib/useAppRouter";

function VerifyEmailRedirect() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      router.replace(`/verify?token=${token}`);
    } else {
      router.replace("/verify");
    }
  }, [router, token]);

  return null;
}

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailRedirect />
    </Suspense>
  );
}
