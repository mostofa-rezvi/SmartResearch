from pypdf import PdfReader
import sys
import os

files = [
    r"d:\github\SmartResearch\ResearchBridge Project Proposal.pdf",
    r"d:\github\SmartResearch\ResearchBridge.pdf",
    r"d:\github\SmartResearch\SRCP Project Overview.pdf"
]

for f in files:
    try:
        reader = PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        out_f = f + ".txt"
        with open(out_f, "w", encoding="utf-8") as out:
            out.write(text)
        print(f"Successfully extracted {f} to {out_f}")
    except Exception as e:
        print(f"Error extracting {f}: {e}")
