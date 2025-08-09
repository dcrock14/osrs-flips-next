
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, BarChart3, CalendarDays, Coins, Gauge, History, Plus, Rocket, Search, Settings, Swords, Trophy, Upload } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

/**
 * OSRS Flipping Dashboard — Next.js (Option A) ready
 * - Local state + localStorage
 * - RuneLite CSV importer (summary TSV or offer log CSV)
 */

const MAX_CASH = 2_147_000_000;
const STARTING_CASH = 1_000;

type Flip = { id: string, item: string, qty: number, buyPrice: number, sellPrice: number, ts: number };
type DailySummary = { date: string, flips: number, items: number, profit: number, netWorth: number, growthPct: number, progressPct: number };
type LeaderboardRow = { item: string, flips: number, profit: number, roiPct: number };

const MOCK_FLIPS: Flip[] = [
  { id: "1", item: "Rune arrow", qty: 5000, buyPrice: 41, sellPrice: 41.9, ts: Date.now() - 3*86400000 },
  { id: "2", item: "Cannonball", qty: 4000, buyPrice: 176, sellPrice: 176.9, ts: Date.now() - 2*86400000 },
  { id: "3", item: "Soul rune", qty: 2000, buyPrice: 132, sellPrice: 132.8, ts: Date.now() - 2*86400000 },
  { id: "4", item: "Zulrah's scales", qty: 10000, buyPrice: 110, sellPrice: 110.7, ts: Date.now() - 86400000 },
  { id: "5", item: "Atlatl dart", qty: 3000, buyPrice: 390, sellPrice: 393.4, ts: Date.now() - 86400000 },
  { id: "6", item: "Chaos rune", qty: 6000, buyPrice: 79, sellPrice: 79.7, ts: Date.now() - 3600000 },
];

const f = new Intl.NumberFormat();
const gp = (n:number) => `${f.format(Math.round(n))} gp`;
const pct = (n:number) => `${(n*100).toFixed(2)}%`;
const mid = (a:number,b:number)=> (a+b)/2;

function calcProfit(flip: Flip){
  const gross = (flip.sellPrice - flip.buyPrice) * flip.qty;
  return Math.round(gross);
}
function dayKey(ts:number){
  const d = new Date(ts);
  return d.toISOString().slice(0,10);
}
function summarizeDaily(flips: Flip[]): DailySummary[]{
  const byDay: Record<string, Flip[]> = {};
  flips.forEach(fl => { const k = dayKey(fl.ts); (byDay[k] ||= []).push(fl); });
  const days = Object.keys(byDay).sort((a,b)=> a<b?1:-1);
  let runningNet = STARTING_CASH;
  const out: DailySummary[] = [];
  days.forEach((date, i) => {
    const group = byDay[date];
    const profit = group.reduce((s,fl)=> s+calcProfit(fl),0);
    runningNet += profit;
    const prev = i===0 ? STARTING_CASH : out[i-1].netWorth;
    const growthPct = prev === 0 ? 0 : (runningNet - prev) / prev;
    const progressPct = runningNet / MAX_CASH;
    const items = new Set(group.map(g=>g.item)).size;
    out.push({ date, flips: group.length, items, profit, netWorth: runningNet, growthPct, progressPct });
  });
  return out;
}
function buildLeaderboard(flips: Flip[]): LeaderboardRow[]{
  const map: Record<string, { profit:number, cost:number, flips:number }>= {};
  flips.forEach(fl => {
    const p = calcProfit(fl);
    const cost = fl.buyPrice * fl.qty;
    const k = fl.item;
    map[k] ||= { profit:0, cost:0, flips:0 };
    map[k].profit += p;
    map[k].cost += cost;
    map[k].flips += 1;
  });
  return Object.entries(map).map(([item, v])=> ({
    item, flips: v.flips, profit: v.profit, roiPct: v.cost ? v.profit / v.cost : 0,
  }));
}
function useLocalState<T>(key:string, initial:T){
  const [state, setState] = useState<T>(()=>{
    try{ const raw = localStorage.getItem(key); return raw? JSON.parse(raw): initial; }catch{ return initial; }
  });
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(state)); }catch{} }, [key, state]);
  return [state, setState] as const;
}

export default function Page(){
  const [flips, setFlips] = useLocalState<Flip[]>("osrs:flips", MOCK_FLIPS);
  const [sortBy, setSortBy] = useLocalState<"roi"|"profit">("osrs:sort","profit");
  const [winnersOnly, setWinnersOnly] = useLocalState<boolean>("osrs:winners", true);
  const [query, setQuery] = useState("");

  const daily = useMemo(()=> summarizeDaily(flips), [flips]);
  const leaderboardBase = useMemo(()=> buildLeaderboard(flips), [flips]);
  const leaderboard = useMemo(()=>{
    return leaderboardBase
      .filter(r=> winnersOnly ? r.profit>0 : true)
      .filter(r=> r.item.toLowerCase().includes(query.toLowerCase()))
      .sort((a,b)=> sortBy==="roi" ? b.roiPct-a.roiPct : b.profit-a.profit);
  }, [leaderboardBase, winnersOnly, sortBy, query]);

  const latest = daily[0];
  const progress = latest?.progressPct ?? (STARTING_CASH / MAX_CASH);
  const etaDays = useMemo(()=>{
    if(daily.length < 2) return Infinity;
    const window = daily.slice(1, Math.min(4, daily.length));
    const avg = window.reduce((s,d)=> s+d.profit,0) / window.length || 0;
    if(avg<=0) return Infinity;
    const remaining = MAX_CASH - (latest?.netWorth ?? STARTING_CASH);
    return Math.ceil(remaining / avg);
  }, [daily, latest]);

  const chartData = daily.slice().reverse().map(d=> ({ name: d.date.slice(5), net: d.netWorth, growth: d.growthPct*100 }));

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <TopBar />
      <main className="mx-auto max-w-7xl px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Header progress={progress} etaDays={etaDays} />
          <DailySummary daily={daily} />
          <ChartPanel data={chartData} />
        </div>
        <aside className="lg:col-span-1 space-y-4">
          <CopilotCard />
          <Leaderboard
            rows={leaderboard}
            sortBy={sortBy}
            setSortBy={(v)=> setSortBy(v as any)}
            winnersOnly={winnersOnly}
            setWinnersOnly={setWinnersOnly}
            query={query}
            setQuery={setQuery}
          />
          <IngestPanel onAdd={(items)=> setFlips(prev=> [...prev, ...items])} onReset={()=> setFlips([])} />
        </aside>
      </main>
    </div>
  );
}

function TopBar(){
  return (
    <div className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto max-w-7xl flex items-center gap-3 px-4 py-3">
        <Coins className="h-5 w-5 text-yellow-400" />
        <span className="font-semibold">1K to Max</span>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2"><BarChart3 className="h-4 w-4"/>Charts</Button>
          <Button variant="ghost" size="sm" className="gap-2"><History className="h-4 w-4"/>Flip Logs</Button>
          <Button variant="secondary" size="sm" className="gap-2"><Settings className="h-4 w-4"/>Settings</Button>
        </div>
      </div>
    </div>
  );
}

function Header({ progress, etaDays }:{ progress:number, etaDays:number }){
  return (
    <Card className="bg-neutral-900/60 border-neutral-800">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl md:text-2xl font-bold">1,000 GP to Max Cash Challenge</h1>
          <Badge className="bg-neutral-800 border-neutral-700">Dashboard</Badge>
        </div>
        <p className="mt-2 text-sm text-neutral-400">This dashboard tracks my flipping progress, starting from <span className="text-neutral-200 font-semibold">1,000 GP</span> with the goal of reaching <span className="text-neutral-200 font-semibold">2.147B</span> max cash stack.</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Stat icon={<Gauge className="h-4 w-4"/>} label="Challenge Progress" value={pct(progress)}>
            <Progress value={progress*100} className="mt-2"/>
          </Stat>
          <Stat icon={<Rocket className="h-4 w-4"/>} label="ETA to Max Cash" value={etaDays===Infinity? "—" : `${etaDays} days`} />
          <Stat icon={<CalendarDays className="h-4 w-4"/>} label="Last Data Upload" value={new Date().toLocaleString()} sub="(local)" />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({icon,label,value,children,sub}:{icon:React.ReactNode,label:string,value:string,children?:React.ReactNode,sub?:string}){
  return (
    <div className="rounded-2xl border border-neutral-800 p-4 bg-neutral-950/40">
      <div className="flex items-center gap-2 text-neutral-300"><span>{icon}</span><span className="text-sm">{label}</span></div>
      <div className="mt-1 text-lg font-semibold">{value} {sub? <span className="text-xs text-neutral-500 align-middle ml-1">{sub}</span>: null}</div>
      {children}
    </div>
  );
}

function DailySummary({ daily }:{ daily: DailySummary[] }){
  const [page, setPage] = useState(0);
  const pageSize = 3;
  const pages = Math.max(1, Math.ceil(daily.length / pageSize));
  const slice = daily.slice(page*pageSize, page*pageSize+pageSize);
  const newestKey = slice[0]?.date;

  return (
    <Card className="bg-neutral-900/60 border-neutral-800">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Daily Summary Log</h2>
          <div className="flex items-center gap-2">
            <Button onClick={()=> setPage(p=> Math.max(0,p-1))} variant="outline" size="sm">Prev</Button>
            <span className="text-sm text-neutral-400">{page+1} / {pages}</span>
            <Button onClick={()=> setPage(p=> Math.min(pages-1,p+1))} size="sm">Next</Button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {slice.map((d)=> (
            <div key={d.date} className={`rounded-2xl border ${d.date===newestKey? "border-blue-700/50" : "border-neutral-800"} bg-neutral-950/40 p-4`}> 
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-amber-700/40 border-amber-700/60">Day {dayNumber(d, daily)}</Badge>
                  <span className="text-sm text-neutral-400">{d.date}</span>
                  {d.date===newestKey && <Badge className="bg-blue-900/30 border-blue-800">In Progress</Badge>}
                </div>
                <Button size="sm" variant="secondary" className="gap-2"><Swords className="h-4 w-4"/>View Flips</Button>
              </div>

              <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <Metric label="Flips" value={f.format(d.flips)} />
                <Metric label="Items" value={f.format(d.items)} />
                <Metric label="Profit" value={gp(d.profit)} />
                <Metric label="Net Worth" value={gp(d.netWorth)} />
                <Metric label="Growth" value={pct(d.growthPct)} />
              </div>
              <div className="mt-2">
                <Label className="text-xs text-neutral-400">Progress</Label>
                <Progress value={d.progressPct*100} className="mt-1"/>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function dayNumber(d:DailySummary, all:DailySummary[]){
  const idx = all.findIndex(x=> x.date===d.date);
  return all.length - idx;
}

function Metric({label, value}:{label:string, value:string}){
  return (
    <div className="rounded-xl border border-neutral-800 p-3 bg-neutral-900/40">
      <div className="text-neutral-400 text-xs">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function ChartPanel({ data }:{ data: {name:string, net:number, growth:number}[] }){
  return (
    <Card className="bg-neutral-900/60 border-neutral-800">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2"><BarChart3 className="h-4 w-4"/><h3 className="font-semibold">Net Worth & Growth</h3></div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="name" stroke="#a3a3a3"/>
              <YAxis yAxisId="left" stroke="#a3a3a3"/>
              <YAxis yAxisId="right" orientation="right" stroke="#a3a3a3"/>
              <Tooltip formatter={(v:any, n:any)=> n==="net"? gp(v): `${v.toFixed(2)}%` }/>
              <Line yAxisId="left" type="monotone" dataKey="net" dot={false} strokeWidth={2}/>
              <Line yAxisId="right" type="monotone" dataKey="growth" dot={false} strokeWidth={2}/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function CopilotCard(){
  return (
    <Card className="border-indigo-800/50" >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-xl p-2 bg-indigo-900/50 border border-indigo-700"><Trophy className="h-5 w-5"/></div>
          <div className="space-y-2">
            <div className="font-semibold">Powered by Flipping Copilot</div>
            <p className="text-sm text-neutral-300">Trade recommendations & flip tracking. Import completed flips automatically or paste a CSV.</p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">Join Discord</Button>
              <Button size="sm" className="gap-2"><Upload className="h-4 w-4"/>Import CSV</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Leaderboard({ rows, sortBy, setSortBy, winnersOnly, setWinnersOnly, query, setQuery }:{
  rows: LeaderboardRow[];
  sortBy: "roi" | "profit";
  setSortBy: (v:"roi"|"profit")=>void;
  winnersOnly: boolean;
  setWinnersOnly: (v:boolean)=>void;
  query: string;
  setQuery: (v:string)=>void;
}){
  return (
    <Card className="bg-neutral-900/60 border-neutral-800">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">Item Leaderboard</div>
          <a className="text-xs text-blue-400 hover:underline" href="#">View full item stats</a>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v)=> setSortBy(v as any)}>
            <SelectTrigger><select className="hidden"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="roi">ROI</SelectItem>
              <SelectItem value="profit">PROFIT</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-xs text-neutral-400 mx-2">Direction:</div>
          <Badge className="bg-green-900/40 border-green-800">Winners</Badge>
          <Switch checked={winnersOnly} onCheckedChange={setWinnersOnly} />
          <Badge className="bg-red-900/40 border-red-800">Losers</Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-2 top-2.5 text-neutral-500"/>
            <Input className="pl-8 h-9" placeholder="Search item" value={query} onChange={(e)=> setQuery(e.target.value)} />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Flips</TableHead>
              <TableHead className="text-right">ROI</TableHead>
              <TableHead className="text-right">Profit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.slice(0,10).map((r)=> (
              <TableRow key={r.item}>
                <TableCell className="font-medium">{r.item}</TableCell>
                <TableCell className="text-right">{f.format(r.flips)}</TableCell>
                <TableCell className="text-right">{pct(r.roiPct)}</TableCell>
                <TableCell className="text-right">{gp(r.profit)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption className="text-neutral-500">Top {Math.min(10, rows.length)} items • Sorted by {sortBy.toUpperCase()}</TableCaption>
        </Table>
      </CardContent>
    </Card>
  );
}

function IngestPanel({ onAdd, onReset }:{ onAdd: (flips:Flip[])=>void, onReset: ()=>void }){
  return (
    <Card className="bg-neutral-900/60 border-neutral-800">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2 font-semibold"><Plus className="h-4 w-4"/>Add Flips</div>
        <Dialog>
          <DialogTrigger>
            <Button size="sm" className="w-full">Manual Entry</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Flip</DialogTitle>
            </DialogHeader>
            <FlipForm onSubmit={onAdd}/>
          </DialogContent>
        </Dialog>
        <CSVImport onAdd={onAdd}/>
        <RuneLiteImport onAdd={onAdd}/>
        <Button size="sm" variant="destructive" onClick={onReset}>Reset All Data</Button>
      </CardContent>
    </Card>
  );
}

function FlipForm({ onSubmit }:{ onSubmit: (items:Flip[])=>void }){
  const [item, setItem] = useState("");
  const [qty, setQty] = useState(1000);
  const [buyPrice, setBuyPrice] = useState(10);
  const [sellPrice, setSellPrice] = useState(10.2);
  function add(){
    if(!item) return;
    const fl: Flip = { id: crypto.randomUUID(), item, qty, buyPrice, sellPrice, ts: Date.now() };
    onSubmit([fl]);
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Item</Label><Input value={item} onChange={(e)=> setItem((e.target as HTMLInputElement).value)} placeholder="e.g. Rune arrow"/></div>
        <div><Label>Quantity</Label><Input type="number" value={qty} onChange={(e)=> setQty(parseInt((e.target as HTMLInputElement).value||"0"))}/></div>
        <div><Label>Buy Price</Label><Input type="number" step="0.1" value={buyPrice} onChange={(e)=> setBuyPrice(parseFloat((e.target as HTMLInputElement).value||"0"))}/></div>
        <div><Label>Sell Price</Label><Input type="number" step="0.1" value={sellPrice} onChange={(e)=> setSellPrice(parseFloat((e.target as HTMLInputElement).value||"0"))}/></div>
      </div>
      <Button className="w-full gap-2" onClick={add}>Add Flip <ArrowUpRight className="h-4 w-4"/></Button>
    </div>
  );
}

function CSVImport({ onAdd }:{ onAdd:(items:Flip[])=>void }){
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  function parse(){
    setError(null);
    try{
      const rows = raw.split(/\\r?\\n/).map(l=> l.trim()).filter(Boolean);
      const out: Flip[] = rows.map((line, i)=>{
        const [item, qty, buy, sell, ts] = line.split(",").map(s=> s.trim());
        if(!item || !qty || !buy || !sell) throw new Error(`Row ${i+1} missing fields`);
        return { id: crypto.randomUUID(), item, qty: Number(qty), buyPrice: Number(buy), sellPrice: Number(sell), ts: ts? Number(ts): Date.now() };
      });
      onAdd(out); setRaw("");
    }catch(e:any){ setError(e.message || "Parse error"); }
  }
  return (
    <div className="space-y-2">
      <Label className="text-sm">Paste CSV (item,qty,buyPrice,sellPrice,ts)</Label>
      <textarea value={raw} onChange={(e)=> setRaw((e.target as HTMLTextAreaElement).value)} className="w-full h-28 rounded-xl bg-neutral-900 border border-neutral-800 p-2 text-sm" placeholder="Rune arrow,5000,41,41.9,1723131123123"/>
      {error && <div className="text-red-400 text-xs">{error}</div>}
      <Button variant="secondary" size="sm" onClick={parse}>Import</Button>
    </div>
  );
}

/** RuneLite Importer (summary TSV or offer log CSV) */
function RuneLiteImport({ onAdd }:{ onAdd:(items:Flip[])=>void }){
  const [taxPct, setTaxPct] = useState(2);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  function onFile(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0];
    if(!file) return;
    setFileName(file.name); setError(null);
    const reader = new FileReader();
    reader.onload = ()=>{
      try{
        const text = String(reader.result||"");
        const flips = parseRuneLiteCSV(text, taxPct/100);
        onAdd(flips);
      }catch(err:any){ setError(err.message || "Failed to parse RuneLite file"); }
    };
    reader.readAsText(file);
  }
  return (
    <div className="space-y-2">
      <Label className="text-sm">Import RuneLite GE CSV/TSV</Label>
      <div className="flex items-center gap-2">
        <input type="file" accept=".csv,.tsv,.txt" onChange={onFile} className="text-sm"/>
        <Input type="number" className="w-24 h-9" value={taxPct} onChange={(e)=> setTaxPct(Number((e.target as HTMLInputElement).value||0))} />
        <Label className="text-xs text-neutral-400">GE Tax %</Label>
      </div>
      {fileName && <div className="text-xs text-neutral-400">Loaded: {fileName}</div>}
      {error && <div className="text-xs text-red-400">{error}</div>}
    </div>
  );
}

function parseRuneLiteCSV(text:string, tax:number){
  const linesRaw = text.split(/\\r?\\n/).filter(Boolean);
  if(linesRaw.length < 2) throw new Error("File is empty");
  const delim = linesRaw[0].includes("\t") ? "\t" : ",";
  const split = (row:string) => row.split(delim).map(s=> s.trim());
  const header = split(linesRaw[0]).map(h=> h.toLowerCase());

  const isSummary = header.includes("first buy time") && header.some(h=> h.includes("avg. buy price"));

  if(isSummary){
    const idx = {
      item: header.findIndex(h=> h==="item"),
      bought: header.findIndex(h=> h==="bought"),
      sold: header.findIndex(h=> h==="sold"),
      avgBuy: header.findIndex(h=> h.includes("avg. buy")),
      avgSell: header.findIndex(h=> h.includes("avg. sell")),
      tax: header.findIndex(h=> h==="tax"),
      lastSell: header.findIndex(h=> h.includes("last sell")),
    } as const;
    if(Object.values(idx).some(v=> v===-1)) throw new Error("Unrecognized summary columns");

    const flips: Flip[] = [];
    for(const row of linesRaw.slice(1)){
      const c = split(row);
      const item = c[idx.item];
      const qtySold = Number(c[idx.sold]||0);
      const qtyBought = Number(c[idx.bought]||0);
      const qty = Math.min(qtySold, qtyBought) || qtySold || qtyBought;
      const avgBuy = Number(c[idx.avgBuy]||0);
      const avgSell = Number(c[idx.avgSell]||0);
      const totalTax = Number(c[idx.tax]||0);
      const ts = Date.parse(c[idx.lastSell]||"") || Date.now();
      if(!item || !qty || !avgBuy || !avgSell) continue;
      const perUnitTax = qty ? (totalTax/qty) : 0;
      const netSellPer = Math.max(0, avgSell - perUnitTax);
      flips.push({ id: crypto.randomUUID(), item, qty, buyPrice: avgBuy, sellPrice: netSellPer, ts });
    }
    return flips;
  }

  const idx = {
    time: header.findIndex(h=> /time/.test(h)),
    type: header.findIndex(h=> /(offer|type)/.test(h)),
    item: header.findIndex(h=> /item/.test(h)),
    price: header.findIndex(h=> /price/.test(h)),
    qty: header.findIndex(h=> /(qty|quantity)/.test(h)),
  } as const;
  if(Object.values(idx).some(v=> v===-1)) throw new Error("Unrecognized header for offer log");

  type Offer = { ts:number, item:string, type:"BUY"|"SELL", qty:number, price:number };
  const offers: Offer[] = linesRaw.slice(1).map((row)=>{
    const cells = split(row);
    const typeRaw = (cells[idx.type]||"").toUpperCase();
    type OfferType = "BUY" | "SELL";
const toOfferType = (s: string): OfferType => (
  s.includes("BUY") || s.includes("BOUGHT") ? "BUY" : "SELL"
);

const typeRaw = (cells[idx.type]||"").toUpperCase();
const type: OfferType = toOfferType(typeRaw);

    const item = (cells[idx.item]||"").trim();
    const qty = Number(cells[idx.qty]||0);
    const price = Number(cells[idx.price]||0);
    return { ts, item, type, qty, price };
  }).filter(o=> o.item && o.qty>0 && o.price>0);

  offers.sort((a,b)=> a.ts-b.ts);
  const queues: Record<string, { qty:number, price:number }[]> = {};
  const flips: Flip[] = [];

  for(const o of offers){
    queues[o.item] ||= [];
    if(o.type === "BUY"){
      queues[o.item].push({ qty: o.qty, price: o.price });
    }else{
      let remaining = o.qty;
      while(remaining>0){
        const lot = queues[o.item][0];
        if(!lot) break;
        const take = Math.min(remaining, lot.qty);
        const sellPriceNet = o.price * (1 - tax);
        flips.push({ id: crypto.randomUUID(), item: o.item, qty: take, buyPrice: lot.price, sellPrice: sellPriceNet, ts: o.ts });
        lot.qty -= take;
        remaining -= take;
        if(lot.qty<=0) queues[o.item].shift();
      }
    }
  }
  return flips;
}
