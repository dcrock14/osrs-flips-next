import React from "react";
export function Badge({ className="", children }:{ className?:string, children: React.ReactNode }){
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-xs ${className}`}>{children}</span>;
}
