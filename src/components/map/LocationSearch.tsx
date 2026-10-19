import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Compass, X, Loader2 } from 'lucide-react';
import { INDONESIA_LOCATION_PRESETS, LocationPreset } from '../../constants/presets';

interface LocationSearchProps {
  onSelectLocation: (lat: number, lng: number, zoom?: number) => void;
}

interface SearchResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({ onSelectLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    // Check if query is coordinate string like: -6.175, 106.827
    const coordMatch = query.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=id&limit=5`,
          {
            headers: {
              'Accept-Language': 'id,en',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.warn('Geocoding search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Parse coordinates
    const coordMatch = query.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[3]);
      if (!isNaN(lat) && !isNaN(lng)) {
        onSelectLocation(lat, lng, 16);
        setShowDropdown(false);
        return;
      }
    }

    if (results.length > 0) {
      const top = results[0];
      onSelectLocation(parseFloat(top.lat), parseFloat(top.lon), 16);
      setShowDropdown(false);
    }
  };

  const handleSelectPreset = (preset: LocationPreset) => {
    onSelectLocation(preset.lat, preset.lng, preset.zoom);
    setQuery(preset.name);
    setShowDropdown(false);
  };

  const handleSelectResult = (r: SearchResult) => {
    onSelectLocation(parseFloat(r.lat), parseFloat(r.lon), 16);
    setQuery(r.display_name.split(',')[0]);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} className="relative w-[calc(100vw-76px)] sm:w-80 md:w-84 max-w-[340px] z-[500]">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center bg-[#071629]/95 backdrop-blur-md border border-[#1E3A5F] rounded-lg px-3 py-2 text-sm shadow-xl focus-within:border-[#2A9D8F] focus-within:ring-1 focus-within:ring-[#2A9D8F] transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Cari lokasi atau koordinat (lat, lng)..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none text-xs sm:text-sm font-sans"
          />
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-[#2A9D8F] animate-spin shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Autocomplete & Presets Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0B2342] border border-[#1E3A5F] rounded-lg shadow-2xl overflow-hidden text-xs max-h-80 overflow-y-auto">
          {/* Coordinate hint */}
          {query.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/) && (
            <div
              onClick={handleSubmit}
              className="p-2.5 bg-[#2A9D8F]/15 border-b border-[#1E3A5F] text-[#2A9D8F] flex items-center gap-2 cursor-pointer hover:bg-[#2A9D8F]/25 font-mono"
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Buka Koordinat: {query}</span>
            </div>
          )}

          {/* Search results from Nominatim */}
          {results.length > 0 && (
            <div>
              <div className="px-3 py-1.5 bg-[#071629] text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Hasil Pencarian Lokasi
              </div>
              {results.map((r) => (
                <div
                  key={r.place_id}
                  onClick={() => handleSelectResult(r)}
                  className="px-3 py-2 hover:bg-[#14365f] cursor-pointer flex items-start gap-2 border-b border-[#1E3A5F]/50 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#2A9D8F] mt-0.5 shrink-0" />
                  <span className="text-slate-200 truncate">{r.display_name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tactical Indonesia Presets */}
          <div>
            <div className="px-3 py-1.5 bg-[#071629] text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Preset Titik Operasional</span>
              <Navigation className="w-3 h-3 text-[#2A9D8F]" />
            </div>
            {INDONESIA_LOCATION_PRESETS.map((p, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectPreset(p)}
                className="px-3 py-2 hover:bg-[#14365f] cursor-pointer flex items-center justify-between border-b border-[#1E3A5F]/30 last:border-0 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div>
                    <div className="text-slate-200 font-medium">{p.name}</div>
                    <div className="text-[10px] text-slate-400">{p.category}</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#2A9D8F]">
                  {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
