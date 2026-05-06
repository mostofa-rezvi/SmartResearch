"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyEmailRedirect() {
  const router = useRouter();
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
