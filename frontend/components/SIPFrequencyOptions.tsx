"use client";

interface FrequencyOption { label: string; sipAmount: number; intervals: number; frequencySeconds: number; }

export default function SIPFrequencyOptions({ frequencies, selectedFrequency, onSelect }: { frequencies: FrequencyOption[]; selectedFrequency: FrequencyOption | null; onSelect: (frequency: FrequencyOption) => void }) {
  return <div className="mb-5"><label className="block mb-2 text-gray-300 font-medium">Choose SIP Frequency</label><div className="flex flex-col gap-2">{frequencies.map((frequency) => <label key={frequency.label} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${selectedFrequency?.label === frequency.label ? 'bg-blue-500/20' : 'bg-black/20'}`} onClick={() => onSelect(frequency)}><div className="flex items-center"><input type="radio" name="frequency" value={frequency.label} checked={selectedFrequency?.label === frequency.label} onChange={() => onSelect(frequency)} className="mr-3 w-4 h-4 accent-blue-500" /><div className="flex flex-col"><span className="text-base font-semibold">{frequency.label}</span><p className="text-gray-400 text-sm m-0">{frequency.intervals} payments</p></div></div><div className="text-right"><p className="text-base font-bold text-green-500 m-0">{frequency.sipAmount} AVAX</p><p className="text-gray-400 text-xs m-0">per payment</p></div></label>)}</div></div>;
}
