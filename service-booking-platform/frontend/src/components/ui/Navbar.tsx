import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090a0f]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group text-decoration-none">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white block">
              Booking Agent <span className="text-indigo-400 font-medium text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">AI Agent</span>
            </span>
            <span className="text-xs text-slate-400 block -mt-0.5">Universal Service Concierge</span>
          </div>
        </Link>
      </div>
    </header>
  );
};
