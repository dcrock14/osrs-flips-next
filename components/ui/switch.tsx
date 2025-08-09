import React from "react";
export function Switch({ checked, onCheckedChange }:{ checked:boolean, onCheckedChange:(v:boolean)=>void }){
  return (
    <button onClick={()=> onCheckedChange(!checked)} className={`w-10 h-6 rounded-full border border-neutral-700 ${checked?"bg-green-600":"bg-neutral-800"}`}>
      <span className={`block h-5 w-5 bg-white rounded-full transition-all ${checked?"translate-x-4":"translate-x-0.5"}`} />
    </button>
  );
}
