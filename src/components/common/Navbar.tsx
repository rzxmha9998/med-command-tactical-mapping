import React, { useState, useEffect, useRef } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TacticalMap, AppSettings } from '../../types';
import { subscribeHeaderSettings } from '../../firebase/services/settingsService';
import { HeaderBrandingModal } from '../admin/HeaderBrandingModal';

interface NavbarProps {
  maps: TacticalMap[];
  currentMap: TacticalMap | null;
  onSelectMap: (map: TacticalMap) => void;
  activeView: 'map' | 'dashboard' | 'officers' | 'access_requests';
  onChangeView: (view: 'map' | 'dashboard' | 'officers' | 'access_requests') => void;
  onOpenCreateMap?: () => void;
  unitsCount: number;
  zonesCount: number;
  isUnitPanelOpen: boolean;
  onToggleUnitPanel: () => void;
  isZonePanelOpen: boolean;
  onToggleZonePanel: () => void;
  pendingRequestsCount?: number;
  onOpenAccessRequests?: () => void;
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
  pendingRequestsCount,
  onOpenAccessRequests,
}) => {
  const { user, profile, isAdmin, logout } = useAuth();
  const [showMapDropdown, setShowMapDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [headerSettings, setHeaderSettings] = useState<AppSettings>({});
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);

  const mapDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time header branding settings from Firestore
  useEffect(() => {
    const unsubscribe = subscribeHeaderSettings((settings) => {
      setHeaderSettings(settings);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        mapDropdownRef.current &&
        !mapDropdownRef.current.contains(e.target as Node)
      ) {
        setShowMapDropdown(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(e.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <>
      <header className="bg-[#071629] border-b border-[#1E3A5F] z-[550] relative select-none">
        {/* ========================================================= */}
        {/* MOBILE VIEW (VIEWPORT < 768px): TWO-TIER NAVBAR           */}
        {/* ========================================================= */}
        <div className="flex flex-col md:hidden">
          {/* Tier 1: Logo, MED-COMMAND Title, Live Sync & Menu Button */}
          <div className="h-12 px-3 flex items-center justify-between border-b border-[#1E3A5F]/40 bg-[#071629]">
            {/* Left: Agency Logo & Brand */}
            <div className="flex items-center gap-2 min-w-0">
              {headerSettings.leftLogoUrl ? (
                <div
                  onClick={() => isAdmin && setIsBrandingModalOpen(true)}
                  className={`w-8 h-8 rounded-lg bg-[#0B2342] border border-[#2A9D8F]/60 overflow-hidden flex items-center justify-center p-0.5 shrink-0 shadow-[0_0_12px_rgba(42,157,143,0.3)] ${
                    isAdmin ? 'cursor-pointer' : ''
                  }`}
                  title={isAdmin ? 'Ubah Logo Instansi' : undefined}
                >
                  <img
                    src={headerSettings.leftLogoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div
                  onClick={() => isAdmin && setIsBrandingModalOpen(true)}
                  className={`w-8 h-8 rounded-lg bg-gradient-to-br from-[#2A9D8F] to-[#14365f] flex items-center justify-center border border-[#2A9D8F]/60 shadow-[0_0_12px_rgba(42,157,143,0.3)] shrink-0 ${
                    isAdmin ? 'cursor-pointer' : ''
                  }`}
                  title={isAdmin ? 'Atur Logo Header' : undefined}
                >
                  <Shield className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="min-w-0 flex items-center gap-2">
                <span className="font-extrabold text-white text-xs tracking-wider font-mono truncate">
                  {headerSettings.agencyName || 'MED-COMMAND'}
                </span>
                {/* Live Sync Pulse Dot */}
                <div className="flex items-center gap-1 shrink-0" title="Koneksi Satelit Aktif">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 font-bold hidden xs:inline">
                    LIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Optional Right Logo & 44x44 Touch Target Menu/Profile Button */}
            <div className="flex items-center gap-2 shrink-0" ref={userDropdownRef}>
              {headerSettings.rightLogoUrl && (
                <div
                  onClick={() => isAdmin && setIsBrandingModalOpen(true)}
                  className="w-7 h-7 rounded-lg bg-[#0B2342] border border-amber-500/50 overflow-hidden flex items-center justify-center p-0.5 shrink-0"
                >
                  <img
                    src={headerSettings.rightLogoUrl}
                    alt="Right Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Mobile Menu / Profile Button (min 44x44px touch area) */}
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-[#0B2342] border border-[#1E3A5F] active:bg-[#14365f] text-slate-200 transition-colors relative cursor-pointer"
                title="Buka Menu & Profil"
                aria-label="Menu Navigasi"
              >
                <div className="w-6 h-6 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white text-xs font-bold">
                  {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                {/* Pending requests dot badge */}
                {isAdmin && (pendingRequestsCount ?? 0) > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse ring-2 ring-[#071629]" />
                )}
              </button>

              {/* Mobile User & Navigation Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-3 top-13 w-64 bg-[#0B2342] border border-[#1E3A5F] rounded-xl shadow-2xl p-2.5 text-xs z-[700] animate-in fade-in zoom-in-95 duration-150">
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
                        {isAdmin ? 'ADMIN MEDIS' : 'PETUGAS LAPANGAN'}
                      </span>
                    </div>
                  </div>

                  <div className="py-1 border-b border-[#1E3A5F] mb-1 space-y-1">
                    <button
                      onClick={() => {
                        onChangeView('map');
                        setShowUserDropdown(false);
                      }}
                      className={`w-full min-h-[44px] px-3 py-2 text-left rounded-lg flex items-center gap-2.5 font-medium transition-colors cursor-pointer ${
                        activeView === 'map'
                          ? 'bg-[#2A9D8F] text-[#071629] font-bold shadow-md'
                          : 'text-slate-300 hover:bg-[#14365f]'
                      }`}
                    >
                      <MapIcon className="w-4 h-4 shrink-0" />
                      <span>Peta Taktis Operasional</span>
                    </button>

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => {
                            onChangeView('dashboard');
                            setShowUserDropdown(false);
                          }}
                          className={`w-full min-h-[44px] px-3 py-2 text-left rounded-lg flex items-center gap-2.5 font-medium transition-colors cursor-pointer ${
                            activeView === 'dashboard'
                              ? 'bg-[#2A9D8F] text-[#071629] font-bold shadow-md'
                              : 'text-slate-300 hover:bg-[#14365f]'
                          }`}
                        >
                          <LayoutDashboard className="w-4 h-4 shrink-0" />
                          <span>Dashboard Admin</span>
                        </button>

                        <button
                          onClick={() => {
                            onChangeView('officers');
                            setShowUserDropdown(false);
                          }}
                          className={`w-full min-h-[44px] px-3 py-2 text-left rounded-lg flex items-center gap-2.5 font-medium transition-colors cursor-pointer ${
                            activeView === 'officers'
                              ? 'bg-[#2A9D8F] text-[#071629] font-bold shadow-md'
                              : 'text-slate-300 hover:bg-[#14365f]'
                          }`}
                        >
                          <Users className="w-4 h-4 shrink-0" />
                          <span>Kelola Akses Petugas</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            onOpenAccessRequests?.();
                          }}
                          className="w-full min-h-[44px] px-3 py-2 text-left rounded-lg flex items-center justify-between text-amber-300 hover:bg-[#14365f] font-medium transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5">
                            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>Permintaan Akses Peta</span>
                          </div>
                          {(pendingRequestsCount ?? 0) > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold animate-pulse">
                              {pendingRequestsCount}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            setIsBrandingModalOpen(true);
                          }}
                          className="w-full min-h-[44px] px-3 py-2 text-left text-slate-300 hover:bg-[#14365f] hover:text-[#2A9D8F] rounded-lg flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Ubah Logo Header Instansi</span>
                        </button>
                      </>
                    )}

                    {!isAdmin && (
                      <button
                        onClick={() => {
                          onChangeView('access_requests');
                          setShowUserDropdown(false);
                        }}
                        className={`w-full min-h-[44px] px-3 py-2 text-left rounded-lg flex items-center gap-2.5 font-medium transition-colors cursor-pointer ${
                          activeView === 'access_requests'
                            ? 'bg-[#2A9D8F] text-[#071629] font-bold shadow-md'
                            : 'text-slate-300 hover:bg-[#14365f]'
                        }`}
                      >
                        <Shield className="w-4 h-4 shrink-0" />
                        <span>Akses Peta Operasional</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={async () => {
                      setShowUserDropdown(false);
                      await logout();
                    }}
                    className="w-full min-h-[44px] px-3 py-2 text-left text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-lg flex items-center gap-2.5 font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tier 2: Compact Map Selector & Quick Unit/Zona/Dash Action Buttons */}
          <div className="h-11 px-3 flex items-center justify-between gap-1.5 bg-[#051120]">
            {/* Map Switcher Pill (Left) */}
            <div className="relative" ref={mapDropdownRef}>
              <button
                type="button"
                onClick={() => setShowMapDropdown(!showMapDropdown)}
                className="h-9 max-w-[135px] sm:max-w-[170px] px-2.5 rounded-lg bg-[#0B2342] hover:bg-[#14365f] border border-[#1E3A5F] text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Ganti Peta Operasional"
              >
                <MapIcon className="w-3.5 h-3.5 text-[#2A9D8F] shrink-0" />
                <span className="truncate">{currentMap?.name || 'Pilih Peta'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Map Selection Dropdown */}
              {showMapDropdown && (
                <div className="absolute left-0 mt-1.5 w-72 bg-[#0B2342] border border-[#1E3A5F] rounded-xl shadow-2xl p-2 text-xs z-[700] animate-in fade-in zoom-in-95 duration-150">
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
                              ? 'bg-[#2A9D8F]/20 border border-[#2A9D8F]/50 text-white font-bold'
                              : 'hover:bg-[#14365f] text-slate-300'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-white truncate">{m.name}</div>
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

            {/* Quick Control Buttons (Right) */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Unit Toggle Button */}
              <button
                type="button"
                onClick={onToggleUnitPanel}
                className={`h-9 px-2.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                  isUnitPanelOpen
                    ? 'bg-[#14365f] text-[#2A9D8F] border border-[#2A9D8F]/60 shadow-md ring-1 ring-[#2A9D8F]/40'
                    : 'bg-[#0B2342] text-slate-300 hover:text-white border border-[#1E3A5F]'
                }`}
                title="Buka/Tutup Menu Unit Medis"
                aria-label="Menu Unit"
              >
                <Radio className="w-3.5 h-3.5 text-rose-400" />
                <span>Unit</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#071629] text-[10px] font-mono font-bold text-[#2A9D8F]">
                  {unitsCount}
                </span>
              </button>

              {/* Zona Toggle Button */}
              <button
                type="button"
                onClick={onToggleZonePanel}
                className={`h-9 px-2.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                  isZonePanelOpen
                    ? 'bg-[#14365f] text-amber-400 border border-amber-500/60 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-[#0B2342] text-slate-300 hover:text-white border border-[#1E3A5F]'
                }`}
                title="Buka/Tutup Menu Zona Risiko"
                aria-label="Menu Zona"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Zona</span>
                <span className="px-1.5 py-0.2 rounded-full bg-[#071629] text-[10px] font-mono font-bold text-amber-400">
                  {zonesCount}
                </span>
              </button>

              {/* Dashboard Shortcut (Admin) or Access Shortcut (Officer) */}
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => onChangeView(activeView === 'dashboard' ? 'map' : 'dashboard')}
                  className={`h-9 px-2.5 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'dashboard'
                      ? 'bg-[#2A9D8F] text-[#071629] shadow-md font-bold'
                      : 'bg-[#0B2342] text-slate-300 hover:text-white border border-[#1E3A5F]'
                  }`}
                  title="Buka Dashboard Admin"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Dash</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onChangeView(activeView === 'access_requests' ? 'map' : 'access_requests')}
                  className={`h-9 px-2 rounded-lg flex items-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'access_requests'
                      ? 'bg-[#2A9D8F] text-[#071629] shadow-md font-bold'
                      : 'bg-[#0B2342] text-slate-300 hover:text-white border border-[#1E3A5F]'
                  }`}
                  title="Akses Peta"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESKTOP VIEW (VIEWPORT >= 768px): SINGLE ROW NAVBAR       */}
        {/* ========================================================= */}
        <div className="hidden md:flex h-14 px-4 items-center justify-between">
          {/* Brand & Left Logo Header */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
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
                  <span className="font-extrabold text-white text-sm tracking-wider font-mono">
                    {headerSettings.agencyName || 'MED-COMMAND'}
                  </span>
                  <span className="inline-block px-1.5 py-0.2 rounded bg-[#1E3A5F] text-[9px] font-mono text-[#2A9D8F] uppercase font-bold">
                    {headerSettings.operationTitle || 'TACTICAL GIS'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Sistem Peta Operasional Tanggap Medis
                </div>
              </div>
            </div>

            {/* Desktop Map Switcher Dropdown */}
            <div className="relative ml-2">
              <button
                onClick={() => setShowMapDropdown(!showMapDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B2342] hover:bg-[#14365f] border border-[#1E3A5F] text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <MapIcon className="w-3.5 h-3.5 text-[#2A9D8F]" />
                <span className="max-w-[170px] truncate">
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
                              ? 'bg-[#2A9D8F]/20 border border-[#2A9D8F]/50 text-white font-bold'
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

          {/* Navigation View Tabs (Desktop) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onChangeView('map')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeView === 'map'
                  ? 'bg-[#2A9D8F] text-[#071629] shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Peta Taktis</span>
            </button>

            {/* Panels togglers when in Map view */}
            {activeView === 'map' && (
              <div className="flex items-center gap-1 ml-1 pl-1 border-l border-[#1E3A5F]">
                <button
                  onClick={onToggleUnitPanel}
                  className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isUnitPanelOpen
                      ? 'bg-[#14365f] text-[#2A9D8F] border border-[#2A9D8F]/50'
                      : 'text-slate-400 hover:text-white hover:bg-[#0B2342]'
                  }`}
                  title="Toggle Panel Unit"
                >
                  <Radio className="w-3.5 h-3.5 text-rose-400" />
                  <span>Unit</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#071629]">
                    {unitsCount}
                  </span>
                </button>

                <button
                  onClick={onToggleZonePanel}
                  className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isZonePanelOpen
                      ? 'bg-[#14365f] text-[#2A9D8F] border border-[#2A9D8F]/50'
                      : 'text-slate-400 hover:text-white hover:bg-[#0B2342]'
                  }`}
                  title="Toggle Panel Zona Risiko"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zona</span>
                  <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#071629]">
                    {zonesCount}
                  </span>
                </button>
              </div>
            )}

            {/* Officer Navigation */}
            {!isAdmin && (
              <button
                onClick={() => onChangeView('access_requests')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  activeView === 'access_requests'
                    ? 'bg-[#2A9D8F] text-[#071629] shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Akses Peta</span>
              </button>
            )}

            {/* Admin Navigation */}
            {isAdmin && (
              <>
                <button
                  onClick={() => onChangeView('dashboard')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'dashboard'
                      ? 'bg-[#2A9D8F] text-[#071629] shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => onChangeView('officers')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    activeView === 'officers'
                      ? 'bg-[#2A9D8F] text-[#071629] shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-[#14365f]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Akses Petugas</span>
                </button>

                <button
                  onClick={onOpenAccessRequests}
                  className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all text-amber-300 hover:bg-[#14365f] bg-[#0B2342] border border-[#1E3A5F] hover:border-amber-500/50 cursor-pointer"
                  title="Tinjau Permintaan Akses Petugas"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Permintaan Akses</span>
                  {(pendingRequestsCount ?? 0) > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold animate-pulse">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </div>

          {/* Right Desktop Controls */}
          <div className="flex items-center gap-3">
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

            {isAdmin && (
              <button
                onClick={() => setIsBrandingModalOpen(true)}
                className="p-1.5 rounded-lg bg-[#0B2342] hover:bg-[#14365f] border border-[#1E3A5F] text-[#2A9D8F] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                title="Atur Logo Sisi Kiri & Kanan Header"
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono font-bold hidden xl:inline">LOGO HEADER</span>
              </button>
            )}

            {/* Realtime Live Sync Indicator */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0B2342] border border-[#1E3A5F] text-[10px] text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              <span>LIVE SYNC</span>
            </div>

            {/* Desktop User Profile Button & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 pl-2 pr-2 py-1 rounded-lg bg-[#0B2342] hover:bg-[#14365f] border border-[#1E3A5F] transition-colors relative cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white text-xs font-bold">
                  {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left pr-1">
                  <div className="text-xs font-bold text-white max-w-[100px] truncate leading-tight">
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
                <div className="absolute right-0 mt-1.5 w-64 bg-[#0B2342] border border-[#1E3A5F] rounded-xl shadow-2xl p-2 text-xs z-[600]">
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

                  <button
                    onClick={async () => {
                      setShowUserDropdown(false);
                      await logout();
                    }}
                    className="w-full p-2 text-left text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 rounded-lg flex items-center gap-2 font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              )}
            </div>
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
