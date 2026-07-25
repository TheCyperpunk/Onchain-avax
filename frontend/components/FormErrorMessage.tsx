"use client";

export default function FormErrorMessage({ message }: { message: string }) {
  if (!message) return null;
  return <div className="bg-red-500/20 border border-red-500 px-3 py-3 rounded-lg mb-5"><p className="text-red-500 text-sm font-medium">{message}</p></div>;
}
