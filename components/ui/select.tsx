import React from "react";
export function Select({ value, onValueChange, children }:{ value:string, onValueChange:(v:string)=>void, children: React.ReactNode }){
  return <div className="relative">
    <select value={value} onChange={(e)=> onValueChange(e.target.value)} className="h-9 rounded-xl bg-neutral-900 border border-neutral-800 px-3 text-sm">
      {children}
    </select>
  </div>;
}
export function SelectItem({ value, children }:{ value:string, children: React.ReactNode }){
  return <option value={value}>{children}</option>;
}
export function SelectTrigger({ children }:{ children: React.ReactNode }){ return <>{children}</>; }
export function SelectContent({ children }:{ children: React.ReactNode }){ return <>{children}</>; }
export function SelectValue(){ return null as any; }
