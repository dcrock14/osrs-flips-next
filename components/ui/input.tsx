import React from "react";
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>){
  return <input {...props} className={`h-10 rounded-xl bg-neutral-900 border border-neutral-800 px-3 text-sm ${props.className||""}`} />;
}
