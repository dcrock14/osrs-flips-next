import React from "react";

export function Card({ className="", children }:{ className?:string, children: React.ReactNode }){
  return <div className={`rounded-2xl border border-neutral-800 bg-neutral-900/60 ${className}`}>{children}</div>;
}
export function CardContent({ className="", children }:{ className?:string, children: React.ReactNode }){
  return <div className={`p-5 ${className}`}>{children}</div>;
}
