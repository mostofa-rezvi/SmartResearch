import React from "react";

export function LiveCursors() {
  const MOCK_CURSORS = [
    { id: 1, x: 250, y: 150, color: "#EC4899", name: "Dr. Smith" },
    { id: 2, x: 500, y: 320, color: "#8B5CF6", name: "Elena R." }
  ];

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {MOCK_CURSORS.map(cursor => (
        <div 
          key={cursor.id} 
          className="absolute transition-all duration-300 ease-out flex flex-col"
          style={{ top: cursor.y, left: cursor.x }}
        >
          {/* Cursor Pointer */}
          <svg width="18" height="24" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 2.5L15.5 10.5L9.5 12.5L7.5 19.5L2.5 2.5Z" fill={cursor.color} stroke="white" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
          
          {/* Cursor Label */}
          <div 
            className="mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </div>
  );
}
