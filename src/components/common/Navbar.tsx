import React, { useState, useEffect } from 'react';
import {
  Shield,
  Layers,
  MapPin,
  Users,
  LogOut,
  ChevronDown,
  Plus,
  Radio,
  SlidersHorizontal,
  LayoutDashboard,
  Map as MapIcon,
  User as UserIcon,
  ShieldCheck,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TacticalMap, AppSettings } from '../../types';
import { subscribeHeaderSettings } from '../../firebase/services/settingsService';
import { HeaderBrandingModal } from '../admin/HeaderBrandingModal';

interface NavbarProps {
  maps: TacticalMap[];
  currentMap: TacticalMap | null;
  onSelectMap: (map: TacticalMap) => void;
  activeView: 'map' | 'dashboard' | 'officers';
  onChangeView: (view: 'map' | 'dashboard' | 'officers') => void;
  onOpenCreateMap?: () => void;
  unitsCount: number;
  zonesCount: number;
  isUnitPanelOpen: boolean;
  onToggleUnitPanel: () => void;
  isZonePanelOpen: boolean;
  onToggleZonePanel: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  maps,
  currentMap,
  onSelectMap,
  activeView,
  onChangeView,
  onOpenCreateMap,
  unitsCount,
  zonesCount,
  isUnitPanelOpen,
  onToggleUnitPanel,
  isZonePanelOpen,
  onToggleZonePanel,
}) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const [showMapDropdown, setShowMapDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [headerSettings, setHeaderSettings] = useState<AppSettings>({});
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);

  // Subscribe to real-time header branding settings from Firestore
  useEffect(() => {
    const unsubscribe = subscribeHeaderSettings((settings) => {
      setHeaderSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      <header className="h-14 bg-[#071629] border-b border-[#1E3A5F] px-3 sm:px-4 flex items-center justify-between z-[550] relative select-none">
        {/* Brand & Left Logo Header */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            {/* Left Header Logo (Admin configurable / Firebase Storage) */}
            {headerSettings.leftLogoUrl ? (
              <div
                onClick={() => isAdmin && setIsBrandingModalOpen(true)}
                className={`w-9 h-9 rounded-lg bg-[#0B2342] border border-[#2A9D8F]/60 overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-[0_0_15px_rgba(42,157,143,0.3)] ${
                  isAdmin ? 'cursor-pointer hover:border-[#2A9D8F]' : ''
                }`}
                title={isAdmin ? 'Klik untuk mengganti logo instansi header' : undefined}
              >
                <img
                  src={headerSettings.leftLogoUrl}
                  alt="Left Header Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div
                onClick={() => isAdmin && setIsBrandingModalOpen(true)}
                className={`w-8 h-8 rounded-lg bg-gradient-to-br from-[#2A9D8F] to-[#14365f] flex items-center justify-center border border-[#2A9D8F]/60 shadow-[0_0_15px_rgba(42,157,143,0.4)] shrink-0 ${
                  isAdmin ? 'cursor-pointer' : ''
                }`}
                title={isAdmin ? 'Klik untuk mengatur logo instansi header' : undefined}
              >
                <Shield className="w-4 h-4 text-white" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-xs sm:text-sm tracking-wider font-mono">
                  {headerSettings.agencyName || 'MED-COMMAND'}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-[#1E3A5F] text-[9px] font-mono text-[#2A9D8F] uppercase font-bold">
                  {headerSettings.operationTitle || 'TACTICAL GIS'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 hidden lg:block">
                Sistem Peta Operasional Tanggap Medis
              </div>
            </div>
          </div>

          {/* Map Switcher Dropdown */}
          <div className="relative ml-1 sm:ml-2">
            <button
              onClick={() => setShowMapDropdown(!showMapDropdown)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#0B2342] hover:bg-[#14365f] border border-[#1E3A5F] text-xs font-semibold text-white transition-colors"
            >
              <MapIcon className="w-3.5 h-3.5 text-[#2A9D8F]" />
              <span className="max-w-[100px] sm:max-w-[170px] truncate">
                {currentMap?.name || 'Pilih Peta'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showMapDropdown && (
              <div className="absolute left-0 mt-1.5 w-72 bg-[#0B2342] border border-[#1E3A5F] rounded-xl shadow-2xl p-2 text-xs z-[600]">
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-[#1E3A5F] mb-1">
                  <span>Daftar Peta Operasional</span>
                  {isAdmin && (
                    <button
                      onClick={() => {
                        setShowMapDropdown(false);
                        onOpenCreateMap?.();
                      }}
                      className="text-[#2A9D8F] hover:underline flex items-center gap-0.5 normal-case"
                    >
                      <Plus className="w-3 h-3" />
                      <span>+ Peta Baru</span>
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {maps.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">
                      Tidak ada peta yang tersedia
                    </div>
                  ) : (
                    maps.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          onSelectMap(m);
                          setShowMapDropdown(false);
                        }}
                        className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                          currentMap?.id === m.id
                            ? 'bg-[#2A9D8F]/20 border border-[#2A9D8F]/50 text-white'
                            : 'hover:bg-[#14365f] text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-white truncate">{m.name}</div>
                          {m.description && (
                            <div className="text-[10px] text-slate-400 truncate">{m.description}</div>
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                            m.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation View Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeView('map')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
              activeView === 'map'
                ? 'bg-[#2A9D8F] text-[#071629] shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Peta Taktis</span>
          </button>

          {/* Panels togglers when in Map view */}
          {activeView === 'map' && (
            <div className="flex items-center gap-1 ml-1 pl-1 border-l border-[#1E3A5F]">
              <button
                onClick={onToggleUnitPanel}
                className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
                  isUnitPanelOpen
                    ? 'bg-[#14365f] text-[#2A9D8F] border border-[#2A9D8F]/50'
                    : 'text-slate-400 hover:text-white hover:bg-[#0B2342]'
                }`}
                title="Toggle Panel Unit"
              >
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden md:inline">Unit</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#071629]">
                  {unitsCount}
                </span>
              </button>

              <button
                onClick={onToggleZonePanel}
                className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all ${
                  isZonePanelOpen
                    ? 'bg-[#14365f] text-[#2A9D8F] border border-[#2A9D8F]/50'
                    : 'text-slate-400 hover:text-white hover:bg-[#0B2342]'
                }`}
                title="Toggle Panel Zona Risiko"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Zona</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#071629]">
                  {zonesCount}
                </span>
              </button>
            </div>
          )}

          {/* Admin Navigation */}
          {isAdmin && (
            <>
              <button
                onClick={() => onChangeView('dashboard')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                  activeView === 'dashboard'
                    ? 'bg-[#2A9D8F] text-[#071629] shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Dashboard</span>
              </button>

              <button
                onClick={() => onChangeView('officers')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all ${
                  activeView === 'officers'
                    ? 'bg-[#2A9D8F] text-[#071629] shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Akses Petugas</span>
              </button>
            </>
          )}
        </div>

        {/* Right Controls: Right Logo + Realtime Status + User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Right Header Logo (Admin configurable / Firebase Storage) */}
          {headerSettings.rightLogoUrl && (
            <div
              onClick={() => isAdmin && setIsBrandingModalOpen(true)}
              className={`w-9 h-9 rounded-lg bg-[#0B2342] border border-amber-500/50 overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)] ${
                isAdmin ? 'cursor-pointer hover:border-amber-400' : ''
              }`}
              title={isAdmin ? 'Klik untuk mengganti logo kanan header' : 'Logo Operasional Kanan'}
            >
              <img
                src={headerSettings.rightLogoUrl}
                alt="Right Header Logo"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Admin Header Logo Config Button */}
          {isAdmin && (
            <button
              onClick={() => setIsBrandingModalOpen(true)}
              className="p-1.5 rounded-lg bg-[#0B2342] hover:bg-[#14365f] border border-[#1E3A5F] text-[#2A9D8F] hover:text-white transition-colors flex items-center gap-1"
              title="Atur Logo Sisi Kiri & Kanan Header"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono font-bold hidden xl:inline">LOGO HEADER</span>
            </button>
          )}

          {/* Realtime Live Sync Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B2342] border border-[#1E3A5F] text-[10px] text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
            <span>LIVE SYNC</span>
          </div>

          {/* User Role Badge & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-lg bg-[#0B2342] hover:bg-[#14365f] border border-[#1E3A5F] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white text-xs font-bold">
                {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <div className="text-xs font-bold text-white max-w-[90px] truncate leading-tight">
                  {profile?.displayName || 'Petugas'}
                </div>
                <span
                  className={`text-[9px] uppercase font-mono font-bold tracking-wider ${
                    isAdmin ? 'text-amber-400' : 'text-[#2A9D8F]'
                  }`}
                >
                  {isAdmin ? 'ADMIN MEDIS' : 'PETUGAS'}
                </span>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-1.5 w-60 bg-[#0B2342] border border-[#1E3A5F] rounded-xl shadow-2xl p-2 text-xs z-[600]">
                <div className="p-2 border-b border-[#1E3A5F] mb-1">
                  <div className="font-bold text-white truncate">{profile?.displayName}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{user?.email}</div>
                  <div className="mt-1">
                    <span
                      className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                        isAdmin
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-[#2A9D8F]/20 text-[#2A9D8F] border border-[#2A9D8F]/40'
                      }`}
                    >
                      Role: {isAdmin ? 'ADMINISTRATOR' : 'PETUGAS LAPANGAN'}
                    </span>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      setIsBrandingModalOpen(true);
                    }}
                    className="w-full p-2 text-left text-slate-300 hover:bg-[#14365f] hover:text-[#2A9D8F] rounded-lg flex items-center gap-2 font-medium transition-colors mb-1"
                  >
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Unggah Logo Kiri & Kanan</span>
                  </button>
                )}

                <button
                  onClick={async () => {
                    setShowUserDropdown(false);
                    await logout();
                  }}
                  className="w-full p-2 text-left text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Header Branding Modal */}
      <HeaderBrandingModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        currentSettings={headerSettings}
        onSettingsUpdated={(updated) => setHeaderSettings(updated)}
      />
    </>
  );
};
