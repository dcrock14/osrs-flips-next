import React from "react";
export function Tabs({ children }:{ children: React.ReactNode }){ return <div>{children}</div> }
export function TabsList({ children }:{ children: React.ReactNode }){ return <div className="flex gap-2">{children}</div> }
export function TabsTrigger({ children }:{ children: React.ReactNode }){ return <button className="px-3 py-1 rounded-xl bg-neutral-800">{children}</button> }
export function TabsContent({ children }:{ children: React.ReactNode }){ return <div className="mt-2">{children}</div> }
