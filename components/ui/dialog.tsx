import React from "react";
export function Dialog({ children }:{ children: React.ReactNode }){ return <>{children}</> }
export function DialogTrigger({ asChild, children }:{ asChild?: boolean, children: React.ReactNode }){ return <>{children}</>; }
export function DialogHeader({ children }:{ children: React.ReactNode }){ return <div className="mb-2">{children}</div>; }
export function DialogTitle({ children }:{ children: React.ReactNode }){ return <div className="text-lg font-semibold">{children}</div>; }
export function DialogContent({ children, className="" }:{ children: React.ReactNode, className?:string }){ return <div className={`p-4 rounded-2xl border border-neutral-800 bg-neutral-950 ${className}`}>{children}</div>; }
