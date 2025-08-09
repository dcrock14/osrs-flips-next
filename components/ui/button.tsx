import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default"|"secondary"|"outline"|"ghost"|"destructive", size?: "sm"|"md"|"lg" };
export function Button({ className="", variant="default", size="md", ...props }: Props){
  const variants: Record<string,string> = {
    default: "bg-indigo-600 hover:bg-indigo-500 text-white",
    secondary: "bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700",
    outline: "bg-transparent border border-neutral-700 hover:bg-neutral-800 text-neutral-100",
    ghost: "bg-transparent hover:bg-neutral-800 text-neutral-100",
    destructive: "bg-red-700 hover:bg-red-600 text-white",
  };
  const sizes: Record<string,string> = {
    sm: "h-9 px-3 rounded-xl text-sm",
    md: "h-10 px-4 rounded-xl",
    lg: "h-12 px-6 rounded-2xl text-lg",
  };
  return <button className={`${variants[variant]} ${sizes[size]} ${className}`} {...props} />;
}
