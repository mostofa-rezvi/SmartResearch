import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";

  // Mock ES response
  const mockData = [
    { title: `${q} in Machine Learning`, type: "Topic" },
    { title: `Dr. Jane Doe - expert in ${q}`, type: "Researcher" },
    { title: `Recent advances in ${q}`, type: "Paper" },
  ];

  return NextResponse.json({ suggestions: mockData });
}
