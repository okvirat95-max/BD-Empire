import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ShoppingBag, Terminal, Sparkles, AlertTriangle, ArrowUpDown, RefreshCw } from 'lucide-react';
import { Resource } from '../types';
import { getResources, subscribeToRealtime } from '../lib/db';
import { ResourceCard } from './HomePage';

interface MarketplacePageProps {
  setPath: (path: string) => void;
  setSelectedResourceId: (id: string) => void;
}

export default function MarketplacePage({ setPath, setSelectedResourceId }: MarketplacePageProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'downloads' | 'views'>('latest');

  const categories = [
    { label: 'All Resources', value: 'all' },
    { label: 'Plugins', value: 'plugin' },
    { label: 'Skripts', value: 'skript' },
    { label: 'Configs', value: 'config' },
    { label: 'Maps', value: 'map' },
    { label: 'Setups', value: 'setup' },
    { label: 'Resource Packs', value: 'resource_pack' },
    { label: 'Other', value: 'other' },
  ];

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const data = await getResources({
        category: activeCategory,
        sortBy,
        searchQuery,
        includeUnapproved: false
      });
      setResources(data);
    } catch (err) {
      console.error('Error fetching catalog', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();

    // Hook realtime updates or local changes so they refresh the catalog automatically
    const unsub = subscribeToRealtime('resources', () => fetchCatalog());
    return () => unsub();
  }, [activeCategory, sortBy, searchQuery]);

  return (
    <div className="py-6 space-y-12">
      {/* Page Header */}
      <div className="border-b border-[#111] pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary font-mono text-xs tracking-widest uppercase mb-2">
                <span>DARKLEAKER RESOURCE INDEX</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block animate-pulse" />
              </div>
              <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-tight">MARKETPLACE</h1>
            </div>

            {/* Quick Upload CTA */}
            <button
              onClick={() => setPath('#/upload')}
              className="px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-display font-bold text-xs tracking-wider uppercase rounded-sm flex items-center gap-2 transition-all duration-300"
            >
              <span>Publish Your Configs</span>
              <span className="text-white">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Filter and Showcase Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Search column */}
          <div className="lg:col-span-8 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search plugins, skripts, profiles, configs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111111]/80 hover:bg-[#151515] focus:bg-[#181818] border border-[#1f1f1f] focus:border-primary/50 rounded-sm py-3 pl-12 pr-4 text-white placeholder-gray-500 text-sm font-sans outline-none transition-all duration-300"
            />
          </div>

          {/* Sort Selector column */}
          <div className="lg:col-span-4 flex items-center justify-end gap-2 bg-[#111]/40 border border-[#1f1f1f] p-1 rounded-sm">
            <button
              onClick={() => setSortBy('latest')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm font-display font-bold text-[10px] tracking-wider uppercase transition-colors duration-200 ${sortBy === 'latest' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Latest
            </button>
            <button
              onClick={() => setSortBy('downloads')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm font-display font-bold text-[10px] tracking-wider uppercase transition-colors duration-200 ${sortBy === 'downloads' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Downloads
            </button>
            <button
              onClick={() => setSortBy('views')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm font-display font-bold text-[10px] tracking-wider uppercase transition-colors duration-200 ${sortBy === 'views' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" /> Views
            </button>
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#111]">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex-shrink-0 px-4 py-2 font-display font-bold text-xs uppercase tracking-wider transition-all duration-300 border-b-2 ${
                activeCategory === cat.value
                  ? 'border-primary text-primary bg-[#111111]/35'
                  : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Resources Showcase Grid */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-8 h-8 rounded-full border-t-2 border-primary border-r-2 animate-spin" />
            <p className="font-mono text-xs text-gray-500 uppercase tracking-widest">Compiling assets...</p>
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
            {resources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                onClick={() => {
                  setSelectedResourceId(res.id);
                  setPath(`#/resource/${res.id}`);
                }}
              />
            ))}
          </div>
        ) : (
          /* Sleek premium empty state matching user instructions */
          <div className="relative border border-primary/20 bg-[#0d0d0d] p-12 text-center rounded-sm overflow-hidden shadow-2xl max-w-2xl mx-auto my-8">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
            
            <div className="flex justify-center mb-6">
              <div className="relative block">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-125 animate-pulse" />
                <div className="p-5 bg-gradient-to-b from-[#151515] to-[#0a0a0a] rounded-full border border-primary/30 text-primary relative z-10">
                  <ShoppingBag className="w-10 h-10" />
                </div>
              </div>
            </div>

            <h3 className="font-display font-black text-2xl text-white uppercase tracking-wider mb-4 leading-tight">
              No Resources Available Yet
            </h3>
            
            <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed mb-8 font-sans">
              Approved community resources will automatically appear here once creators publish them.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => setPath('#/upload')}
                className="px-8 py-3 bg-primary hover:bg-primary/95 text-white font-display font-bold text-xs uppercase tracking-widest rounded-sm border-l-2 border-primary active:scale-95 transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/45"
              >
                Publish First Resource
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
