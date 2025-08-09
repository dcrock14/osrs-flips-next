import React from "react";
export function Table({ children }:{ children: React.ReactNode }){ return <table className="w-full text-sm">{children}</table>; }
export function TableHeader({ children }:{ children: React.ReactNode }){ return <thead className="text-neutral-400">{children}</thead>; }
export function TableBody({ children }:{ children: React.ReactNode }){ return <tbody className="divide-y divide-neutral-800">{children}</tbody>; }
export function TableRow({ children }:{ children: React.ReactNode }){ return <tr className="hover:bg-neutral-900/40">{children}</tr>; }
export function TableHead({ children, className="" }:{ children: React.ReactNode, className?:string }){ return <th className={`text-left py-2 ${className}`}>{children}</th>; }
export function TableCell({ children, className="" }:{ children: React.ReactNode, className?:string }){ return <td className={`py-2 ${className}`}>{children}</td>; }
export function TableCaption({ children, className="" }:{ children: React.ReactNode, className?:string }){ return <caption className={`mt-2 text-left ${className}`}>{children}</caption>; }
