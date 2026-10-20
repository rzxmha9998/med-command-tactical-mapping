import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/common/Navbar';
import { TacticalMapComponent } from './components/map/TacticalMap';
import { UnitListPanel } from './components/units/UnitListPanel';
import { UnitDetailDrawer } from './components/units/UnitDetailDrawer';
import { UnitFormModal } from './components/units/UnitFormModal';
import { ZoneListPanel } from './components/zones/ZoneListPanel';
import { ZoneFormModal } from './components/zones/ZoneFormModal';
import { ZoneAlertDrawer } from './components/zones/ZoneAlertDrawer';
import { searchNearestReferralHospitals } from './firebase/services/referralHospitalService';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { MapFormModal } from './components/admin/MapFormModal';
import { OfficerManagementModal } from './components/admin/OfficerManagementModal';
import { AccessRequestsModal } from './components/admin/AccessRequestsModal';
import { OfficerMapAccessView } from './components/officer/OfficerMapAccessView';
import { OfficerGPSBar } from './components/officer/OfficerGPSBar';
import { ConfirmDialog } from './components/common/ConfirmDialog';
import {
  TacticalMap,
  MedicalUnit,
  RiskZone,
  UserProfile,
  LatLngPoint,
  GeometryType,
  ZoneType,
  OfficerLocation,
} from './types';
import {
  subscribeMaps,
  createMap,
  updateMap,
  deleteMap,
  duplicateMap,
} from './firebase/services/mapService';
import {
  subscribeUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from './firebase/services/unitService';
import {
  subscribeRiskZones,
  createRiskZone,
  updateRiskZone,
  deleteRiskZone,
} from './firebase/services/zoneService';
import { subscribeAllOfficers } from './firebase/services/userService';
import { subscribeAllAccessRequests } from './firebase/services/accessRequestService';
import { subscribeOfficerLocations } from './firebase/services/officerLocationService';
import { Loader2, Shield, AlertCircle, Plus, MapPin, Radio, Layers, ShieldAlert } from 'lucide-react';

function MainApp() {
  const { user, profile, role, isAdmin, loading: authLoading, authStatus } = useAuth();

  // Navigation state
  const [activeView, setActiveView] = useState<'map' | 'dashboard' | 'officers' | 'access_requests'>('map');
  const [isAccessRequestsModalOpen, setIsAccessRequestsModalOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Maps state
  const [maps, setMaps] = useState<TacticalMap[]>([]);
  const [currentMap, setCurrentMap] = useState<TacticalMap | null>(null);
  const [mapsLoading, setMapsLoading] = useState(true);

  // Active Map Data state
  const [units, setUnits] = useState<MedicalUnit[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [officerLocations, setOfficerLocations] = useState<OfficerLocation[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<MedicalUnit | null>(null);
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(null);

  // Officers state (for admin)
  const [officers, setOfficers] = useState<UserProfile[]>([]);

  // Panels visibility (hidden by default on mobile < 768px)
  const [isUnitPanelOpen, setIsUnitPanelOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );
  const [isZonePanelOpen, setIsZonePanelOpen] = useState(false);

  // Modals state
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [editingMap, setEditingMap] = useState<TacticalMap | null>(null);
  const [isOfficerModalOpen, setIsOfficerModalOpen] = useState(false);

  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<MedicalUnit | null>(null);
  const [draftUnitForm, setDraftUnitForm] = useState<Partial<MedicalUnit> | null>(null);

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<RiskZone | null>(null);
  const [pendingZoneGeom, setPendingZoneGeom] = useState<{
    geomType: GeometryType;
    coordsStr: string;
    radius?: number;
    zoneType?: ZoneType;
  } | null>(null);

  // Interactive Plotting / Drawing modes
  const [isPlottingMode, setIsPlottingMode] = useState(false);
  const [draftCoords, setDraftCoords] = useState<LatLngPoint | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Delete Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
  });

  // 1. Subscribe to Maps based on User Role & UID
  useEffect(() => {
    if (!user) return;
    setMapsLoading(true);

    // Demo preview mode fallback for verification
    if (user.uid === 'demo-admin-medcommand') {
      const demoMap: TacticalMap = {
        id: 'demo-map-1',
        name: 'Sektor Operasi Jakarta Pusat',
        description: 'Pusat Komando Medis & Tanggap Darurat Bencana',
        centerLat: -6.175392,
        centerLng: 106.827153,
        defaultZoom: 15,
        status: 'active',
        allowedOfficerIds: [],
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setMaps([demoMap]);
      setCurrentMap(demoMap);
      setUnits([
        {
          id: 'unit-1',
          mapId: 'demo-map-1',
          unitCode: 'AGD-01',
          name: 'Ambulans Gawat Darurat Alpha',
          type: 'ambulance',
          status: 'on_duty',
          lat: -6.1742,
          lng: 106.8285,
          heading: 45,
          crewNames: 'dr. Satria, Ns. Maya',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'unit-2',
          mapId: 'demo-map-1',
          unitCode: 'RJC-02',
          name: 'Motor Reaksi Cepat Bravo',
          type: 'medical_bike',
          status: 'standby',
          lat: -6.1770,
          lng: 106.8250,
          heading: 180,
          crewNames: 'Ns. Hendra',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      setRiskZones([
        {
          id: 'zone-1',
          mapId: 'demo-map-1',
          name: 'Zona Merah Evakuasi Darurat',
          zoneType: 'red',
          geometryType: 'circle',
          coordinates: '-6.175392, 106.827153',
          radius: 350,
          innerRadius: 100,
          riskLevel: 'Bahaya Tinggi',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      setMapsLoading(false);
      return;
    }

    const unsubscribe = subscribeMaps(
      role,
      user.uid,
      (fetchedMaps) => {
        setMaps(fetchedMaps);
        setMapsLoading(false);

        // Keep current map if valid, or restore from localStorage, else pick first map
        if (fetchedMaps.length > 0) {
          const savedActiveMapId = localStorage.getItem('medcommand_active_map_id');
          setCurrentMap((prev) => {
            if (prev && fetchedMaps.some((m) => m.id === prev.id)) {
              return fetchedMaps.find((m) => m.id === prev.id) || fetchedMaps[0];
            }
            if (savedActiveMapId && fetchedMaps.some((m) => m.id === savedActiveMapId)) {
              return fetchedMaps.find((m) => m.id === savedActiveMapId) || fetchedMaps[0];
            }
            return fetchedMaps[0];
          });
        } else {
          setCurrentMap(null);
        }
      },
      (err) => {
        console.error('Failed to subscribe to maps:', err);
        setMapsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, role]);

  // 2. Subscribe to Units & RiskZones for Active Map
  useEffect(() => {
    if (!currentMap) {
      setUnits([]);
      setRiskZones([]);
      return;
    }

    const unsubUnits = subscribeUnits(currentMap.id, (fetchedUnits) => {
      setUnits(fetchedUnits);
    });

    const unsubZones = subscribeRiskZones(currentMap.id, (fetchedZones) => {
      setRiskZones(fetchedZones);
    });

    return () => {
      unsubUnits();
      unsubZones();
    };
  }, [currentMap?.id]);

  // 2b. Subscribe to Realtime Officer GPS Locations for Active Map
  useEffect(() => {
    if (!currentMap) {
      setOfficerLocations([]);
      return;
    }

    const unsubLocations = subscribeOfficerLocations(
      currentMap.id,
      (locations) => {
        setOfficerLocations(locations);
      },
      (err) => {
        console.warn('[MED-COMMAND] Officer locations subscription notice:', err?.message || err);
      }
    );

    return () => unsubLocations();
  }, [currentMap?.id]);

  // 3. Subscribe to Officers if Admin
  useEffect(() => {
    if (!isAdmin) return;
    const unsubOfficers = subscribeAllOfficers((allOfficers) => {
      setOfficers(allOfficers);
    });
    return () => unsubOfficers();
  }, [isAdmin]);

  // 3b. Subscribe to Access Requests if Admin (real-time badge count)
  useEffect(() => {
    if (!isAdmin) return;
    const unsubRequests = subscribeAllAccessRequests((allReqs) => {
      const pending = allReqs.filter((r) => r.status === 'pending');
      setPendingRequestsCount(pending.length);
    });
    return () => unsubRequests();
  }, [isAdmin]);

  // 4. Seed initial map if Admin logs in and no map exists
  useEffect(() => {
    if (isAdmin && !mapsLoading && maps.length === 0 && user) {
      const initDefaultMap = async () => {
        try {
          const mapId = await createMap({
            name: 'Peta Kawasan Monas & Gambir',
            description: 'Sektor pengamanan medis ring 1 Monas, Jalur Evakuasi ke RSCM & RSPAD Gatot Soebroto',
            centerLat: -6.175392,
            centerLng: 106.827153,
            defaultZoom: 16,
            status: 'active',
            allowedOfficerIds: [],
            createdBy: user.uid,
          });

          // Add initial units
          await createUnit(mapId, {
            name: 'Ambulans AGD Advance 01',
            unitCode: 'AGD-01',
            type: 'ambulance',
            status: 'standby',
            lat: -6.176450,
            lng: 106.828500,
            crewNames: 'Dr. Rian & Ns. Sarah',
            hospitalReferral: 'RSUPN Dr. Cipto Mangunkusumo',
            notes: 'Siap dengan defibrillator, ventilator portable, dan kit resusitasi lengkap.',
          });

          await createUnit(mapId, {
            name: 'Motor Medis Reaksi Cepat 01',
            unitCode: 'MTR-01',
            type: 'medical_bike',
            status: 'standby',
            lat: -6.174200,
            lng: 106.825800,
            crewNames: 'Paramedis Bagus',
            hospitalReferral: 'Pos Aju Pintu Silang Monas',
            notes: 'Unit manuver cepat menembus kerumunan, membawa AED & trauma bag.',
          });

          // Add initial risk zone (Red zone)
          const redPoly = [
            { lat: -6.1738, lng: 106.8255 },
            { lat: -6.1738, lng: 106.8288 },
            { lat: -6.1768, lng: 106.8288 },
            { lat: -6.1768, lng: 106.8255 },
          ];
          await createRiskZone(mapId, {
            name: 'Zona Panas Plaza Cawan Monas',
            zoneType: 'red',
            geometryType: 'polygon',
            coordinates: JSON.stringify(redPoly),
            riskLevel: 'Risiko Tinggi - Evakuasi Darurat',
            description: 'Kepadatan massa tinggi, akses mobil terbatas, prioritaskan unit motor medis.',
          });
        } catch (e) {
          console.warn('Initial map seeding skipped or already created:', e);
        }
      };
      initDefaultMap();
    }
  }, [isAdmin, mapsLoading, maps.length, user]);

  // Loading Screen (Only when auth status is initializing)
  if (authStatus === 'initializing') {
    return (
      <div className="min-h-screen bg-[#071629] flex flex-col items-center justify-center text-white">
        <div className="relative mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2A9D8F] to-[#071629] border border-[#2A9D8F] flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(42,157,143,0.6)]">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <span className="w-4 h-4 rounded-full bg-[#2A9D8F] absolute -top-1 -right-1 animate-ping" />
        </div>
        <h2 className="text-sm font-mono font-bold tracking-widest text-slate-300 uppercase">
          MED-COMMAND TACTICAL GIS
        </h2>
        <p className="text-xs text-slate-500 font-mono mt-1">Menginisialisasi Pusat Komando Medis...</p>
      </div>
    );
  }

  // Not logged in
  if (!user || authStatus === 'unauthenticated') {
    return <LoginPage />;
  }

  // Interactive Plot Unit Handlers (Admin Only)
  const handleStartPlotting = (existingCoords?: LatLngPoint, currentFormState?: Partial<MedicalUnit>) => {
    if (!isAdmin || !currentMap) return;
    if (currentFormState) {
      setDraftUnitForm(currentFormState);
    }
    setDraftCoords(existingCoords || { lat: currentMap.centerLat, lng: currentMap.centerLng });
    setIsPlottingMode(true);
    setIsUnitModalOpen(false);
  };

  const handleFinishPlottingSave = () => {
    if (!isAdmin) return;
    setIsPlottingMode(false);
    setIsUnitModalOpen(true);
  };

  // Admin Draw Zone Handlers (Admin Only)
  const handleStartDrawingZone = (zoneType: ZoneType = 'red') => {
    if (!isAdmin) return;
    setIsDrawingMode(true);
    setIsZonePanelOpen(false);
  };

  const handleSaveDrawnZone = (
    geomType: GeometryType,
    coordsStr: string,
    radius?: number,
    zoneType: ZoneType = 'red'
  ) => {
    if (!isAdmin) return;
    setIsDrawingMode(false);
    setPendingZoneGeom({ geomType, coordsStr, radius, zoneType });
    setEditingZone(null);
    setIsZoneModalOpen(true);
  };

  // Map Operations (Admin Only)
  const handleSaveMap = async (data: Omit<TacticalMap, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isAdmin) return;
    if (editingMap) {
      await updateMap(editingMap.id, data);
    } else {
      const newMapId = await createMap(data);
    }
    setEditingMap(null);
  };

  const handleDuplicateMap = async (map: TacticalMap) => {
    if (!isAdmin) return;
    try {
      const newName = `${map.name} (Salinan)`;
      await duplicateMap(map.id, newName, user.uid);
    } catch (e: any) {
      alert(`Gagal menduplikasi peta: ${e.message}`);
    }
  };

  const handleToggleArchive = async (map: TacticalMap) => {
    if (!isAdmin) return;
    const newStatus = map.status === 'active' ? 'archived' : 'active';
    await updateMap(map.id, { status: newStatus });
  };

  const handleDeleteMap = (map: TacticalMap) => {
    if (!isAdmin) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Peta Operasional?',
      message: `Apakah Anda yakin ingin menghapus "${map.name}" secara permanen? Seluruh data unit dan zona risiko di dalam peta ini akan dihapus dari Firestore.`,
      onConfirm: async () => {
        await deleteMap(map.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Unit Operations (Admin Only)
  const handleSaveUnit = async (
    data: Omit<MedicalUnit, 'id' | 'mapId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!isAdmin) {
      throw new Error('Hanya Administrator yang memiliki wewenang menambahkan atau mengubah unit operasional.');
    }
    if (!currentMap) throw new Error('Peta operasional belum dipilih.');
    if (editingUnit) {
      await updateUnit(currentMap.id, editingUnit.id, data);
    } else {
      await createUnit(currentMap.id, data);
    }
    setIsPlottingMode(false);
  };

  const handleDeleteUnit = (unit: MedicalUnit) => {
    if (!isAdmin || !currentMap) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Unit Medis?',
      message: `Hapus "${unit.name} (${unit.unitCode})" dari peta operasional? Data yang dihapus tidak dapat dipulihkan.`,
      onConfirm: async () => {
        await deleteUnit(currentMap.id, unit.id);
        if (selectedUnit?.id === unit.id) setSelectedUnit(null);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Zone Operations
  const handleSaveZone = async (
    data: Omit<RiskZone, 'id' | 'mapId' | 'createdAt' | 'updatedAt'>
  ) => {
    if (!currentMap) throw new Error('Peta operasional belum dipilih.');
    let savedId: string;
    if (editingZone) {
      await updateRiskZone(currentMap.id, editingZone.id, data);
      savedId = editingZone.id;
    } else {
      savedId = await createRiskZone(currentMap.id, data);
    }

    const savedZone: RiskZone = {
      ...data,
      id: savedId,
      mapId: currentMap.id,
      createdAt: editingZone?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Pre-cache nearest referral hospitals in background
    searchNearestReferralHospitals(currentMap.id, savedZone, 10).catch(() => {});

    // Automatically select the zone to open the Zone Alert Drawer
    setSelectedZone(savedZone);
    setEditingZone(null);
    setPendingZoneGeom(null);
  };

  const handleDeleteZone = (zone: RiskZone) => {
    if (!currentMap) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Zona Risiko?',
      message: `Hapus zona "${zone.name}" (${zone.zoneType.toUpperCase()}) dari peta ini?`,
      onConfirm: async () => {
        await deleteRiskZone(currentMap.id, zone.id);
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#071629] overflow-hidden select-none">
      {/* Tactical Navbar */}
      <Navbar
        maps={maps}
        currentMap={currentMap}
        onSelectMap={(m) => {
          setCurrentMap(m);
          localStorage.setItem('medcommand_active_map_id', m.id);
          setSelectedUnit(null);
          setSelectedZone(null);
        }}
        activeView={activeView}
        onChangeView={setActiveView}
        onOpenCreateMap={() => {
          setEditingMap(null);
          setIsMapModalOpen(true);
        }}
        unitsCount={units.length}
        zonesCount={riskZones.length}
        isUnitPanelOpen={isUnitPanelOpen}
        onToggleUnitPanel={() => {
          setIsUnitPanelOpen(!isUnitPanelOpen);
          if (!isUnitPanelOpen) setIsZonePanelOpen(false);
        }}
        isZonePanelOpen={isZonePanelOpen}
        onToggleZonePanel={() => {
          setIsZonePanelOpen(!isZonePanelOpen);
          if (!isZonePanelOpen) setIsUnitPanelOpen(false);
        }}
        pendingRequestsCount={pendingRequestsCount}
        onOpenAccessRequests={() => setIsAccessRequestsModalOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* VIEW 1: MAP OPERATIONAL VIEW */}
        {activeView === 'map' && (
          <>
            {currentMap ? (
              <div className="w-full h-full relative overflow-hidden">
                {/* Main Tactical Map Area (Full 100vw on mobile, side-by-side with sidebar on desktop) */}
                <div
                  className={`w-full h-full relative transition-all duration-300 ${
                    isUnitPanelOpen
                      ? 'md:ml-80 lg:md:ml-92'
                      : isZonePanelOpen
                      ? 'md:ml-80 lg:md:ml-88'
                      : 'md:ml-0'
                  }`}
                >
                  <TacticalMapComponent
                    currentMap={currentMap}
                    units={units}
                    riskZones={riskZones}
                    selectedUnit={selectedUnit}
                    onSelectUnit={(u) => setSelectedUnit(u)}
                    onSelectZone={(z) => setSelectedZone(z)}
                    officerLocations={officerLocations}
                    isPlottingMode={isPlottingMode}
                    onTogglePlottingMode={() => {
                      if (!isAdmin) return;
                      if (!isPlottingMode) {
                        setDraftCoords({ lat: currentMap.centerLat, lng: currentMap.centerLng });
                      }
                      setIsPlottingMode(!isPlottingMode);
                    }}
                    draftUnitCoords={draftCoords}
                    onUpdateDraftCoords={(c) => {
                      if (!isAdmin) return;
                      setDraftCoords(c);
                    }}
                    onConfirmPlotUnit={(coords) => {
                      if (!isAdmin) return;
                      setDraftCoords(coords);
                      setIsPlottingMode(false);
                      setIsUnitModalOpen(true);
                    }}
                    isDrawingMode={isDrawingMode}
                    onToggleDrawingMode={() => {
                      if (!isAdmin) return;
                      setIsDrawingMode(!isDrawingMode);
                    }}
                    onSaveDrawnZone={handleSaveDrawnZone}
                    onCancelDrawing={() => setIsDrawingMode(false)}
                    isAdmin={isAdmin}
                    isUnitPanelOpen={isUnitPanelOpen}
                    isZonePanelOpen={isZonePanelOpen}
                  />

                  {/* Real-time Officer GPS Tracking Bar (Active when Officer is viewing a map) */}
                  {role === 'officer' && currentMap && (
                    <OfficerGPSBar mapId={currentMap.id} mapName={currentMap.name} />
                  )}

                  {/* Plotting Floating Save Banner (when admin is dragging draft marker) */}
                  {isAdmin && isPlottingMode && draftCoords && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[550] bg-[#071629]/98 backdrop-blur-md border border-[#2A9D8F] rounded-2xl shadow-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-4 w-[calc(100vw-32px)] sm:w-auto animate-in slide-in-from-bottom duration-300">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-9 h-9 rounded-xl bg-[#2A9D8F]/20 text-[#2A9D8F] flex items-center justify-center font-bold shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white">Posisi Marker Dipilih:</div>
                          <div className="font-mono text-[11px] text-[#2A9D8F] truncate">
                            {draftCoords.lat.toFixed(6)}, {draftCoords.lng.toFixed(6)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => setIsPlottingMode(false)}
                          className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-[#14365f] text-slate-300 hover:text-white text-xs cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleFinishPlottingSave}
                          className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs shadow-lg cursor-pointer"
                        >
                          Gunakan Koordinat Ini
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Units List Sidebar Panel */}
                <UnitListPanel
                  units={units}
                  selectedUnit={selectedUnit}
                  onSelectUnit={(u) => setSelectedUnit(u)}
                  onAddNewUnit={isAdmin ? () => {
                    setEditingUnit(null);
                    handleStartPlotting();
                  } : undefined}
                  onEditUnit={isAdmin ? (u) => {
                    setEditingUnit(u);
                    setIsUnitModalOpen(true);
                  } : undefined}
                  onDeleteUnit={isAdmin ? handleDeleteUnit : undefined}
                  isAdmin={isAdmin}
                  isOpen={isUnitPanelOpen}
                  onToggleOpen={() => setIsUnitPanelOpen(!isUnitPanelOpen)}
                />

                {/* Risk Zones List Sidebar Panel */}
                <ZoneListPanel
                  zones={riskZones}
                  onSelectZone={(z) => setSelectedZone(z)}
                  onAddNewZone={isAdmin ? handleStartDrawingZone : undefined}
                  onEditZone={isAdmin ? (z) => {
                    setEditingZone(z);
                    setIsZoneModalOpen(true);
                  } : undefined}
                  onDeleteZone={isAdmin ? handleDeleteZone : undefined}
                  isAdmin={isAdmin}
                  isOpen={isZonePanelOpen}
                  onToggleOpen={() => setIsZonePanelOpen(!isZonePanelOpen)}
                />

                {/* Selected Unit Details Drawer */}
                <UnitDetailDrawer
                  unit={selectedUnit}
                  onClose={() => setSelectedUnit(null)}
                  onEdit={isAdmin ? (u) => {
                    setEditingUnit(u);
                    setIsUnitModalOpen(true);
                  } : undefined}
                  onDelete={isAdmin ? handleDeleteUnit : undefined}
                  isAdmin={isAdmin}
                />

                {/* Selected Zone Alert Drawer (Living Radar & Nearest Referral Hospitals) */}
                <ZoneAlertDrawer
                  zone={selectedZone}
                  mapId={currentMap.id}
                  onClose={() => setSelectedZone(null)}
                  onEditZone={isAdmin ? (z) => {
                    setEditingZone(z);
                    setIsZoneModalOpen(true);
                  } : undefined}
                  onDeleteZone={isAdmin ? handleDeleteZone : undefined}
                  isAdmin={isAdmin}
                />
              </div>
            ) : mapsLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <div className="relative mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#0B2342] border border-[#2A9D8F]/60 flex items-center justify-center shadow-[0_0_25px_rgba(42,157,143,0.3)]">
                    <Loader2 className="w-7 h-7 text-[#2A9D8F] animate-spin" />
                  </div>
                  <span className="w-3.5 h-3.5 rounded-full bg-[#2A9D8F] absolute -top-1 -right-1 animate-ping" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider font-mono">
                  Menghubungkan ke Peta Taktis...
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Mengambil data sektor operasional, ambulans, dan zona risiko dari satelit MED-COMMAND.
                </p>
              </div>
            ) : role === 'officer' ? (
              <OfficerMapAccessView
                onSelectMap={(m) => {
                  setCurrentMap(m);
                  setActiveView('map');
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                <Shield className="w-16 h-16 text-slate-600 mb-3 opacity-60" />
                <h3 className="text-base font-bold text-white mb-1">
                  Belum Ada Peta Operasional Aktif
                </h3>
                <p className="text-xs max-w-md text-slate-400 mb-4">
                  Buat peta operasional baru untuk memulai plotting ambulans, motor medis, dan zona risiko.
                </p>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditingMap(null);
                      setIsMapModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#2A9D8F] hover:bg-[#238276] text-[#071629] font-bold text-xs flex items-center gap-2 transition-colors shadow-lg cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Buat Peta Sekarang</span>
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* VIEW: OFFICER MAP ACCESS DIRECTORY */}
        {activeView === 'access_requests' && (
          <OfficerMapAccessView
            onSelectMap={(m) => {
              setCurrentMap(m);
              setActiveView('map');
            }}
          />
        )}

        {/* VIEW 2: ADMIN DASHBOARD */}
        {activeView === 'dashboard' && isAdmin && (
          <AdminDashboard
            maps={maps}
            units={units}
            riskZones={riskZones}
            officers={officers}
            onOpenMap={(m) => {
              setCurrentMap(m);
              setActiveView('map');
            }}
            onCreateMap={() => {
              setEditingMap(null);
              setIsMapModalOpen(true);
            }}
            onEditMap={(m) => {
              setEditingMap(m);
              setIsMapModalOpen(true);
            }}
            onDuplicateMap={handleDuplicateMap}
            onToggleArchiveMap={handleToggleArchive}
            onDeleteMap={handleDeleteMap}
            onOpenOfficerManagement={() => setIsOfficerModalOpen(true)}
            pendingRequestsCount={pendingRequestsCount}
            onOpenAccessRequests={() => setIsAccessRequestsModalOpen(true)}
          />
        )}

        {/* VIEW 3: OFFICERS MANAGEMENT VIEW (Admin Only) */}
        {activeView === 'officers' && isAdmin && (
          <div className="flex-1 p-6 overflow-y-auto">
            <OfficerManagementModal
              isOpen={true}
              onClose={() => setActiveView('map')}
              officers={officers}
              maps={maps}
              onRefresh={() => {}}
            />
          </div>
        )}
      </div>

      {/* Global Modals */}

      {/* 1. Map Form Modal */}
      <MapFormModal
        isOpen={isMapModalOpen}
        onClose={() => {
          setIsMapModalOpen(false);
          setEditingMap(null);
        }}
        onSubmit={handleSaveMap}
        initialData={editingMap}
        officers={officers}
        currentUserId={user.uid}
      />

      {/* 2. Unit Form Modal (Strict Admin Only) */}
      {isAdmin && (
        <UnitFormModal
          isOpen={isUnitModalOpen}
          onClose={() => {
            setIsUnitModalOpen(false);
            setEditingUnit(null);
            setDraftUnitForm(null);
          }}
          onSubmit={async (data) => {
            await handleSaveUnit(data);
            setDraftUnitForm(null);
          }}
          initialData={editingUnit}
          draftFormData={draftUnitForm}
          currentCoords={draftCoords}
          availableZones={riskZones}
          onStartPlottingOnMap={handleStartPlotting}
          isAdmin={isAdmin}
        />
      )}

      {/* 4. Officer Access Requests Modal (Admin Only) */}
      {isAdmin && (
        <AccessRequestsModal
          isOpen={isAccessRequestsModalOpen}
          onClose={() => setIsAccessRequestsModalOpen(false)}
          maps={maps}
        />
      )}
      <ZoneFormModal
        isOpen={isZoneModalOpen}
        onClose={() => {
          setIsZoneModalOpen(false);
          setEditingZone(null);
          setPendingZoneGeom(null);
        }}
        onSubmit={handleSaveZone}
        initialData={editingZone}
        geometryType={pendingZoneGeom?.geomType || 'polygon'}
        coordinates={pendingZoneGeom?.coordsStr || '[]'}
        radius={pendingZoneGeom?.radius}
        initialZoneType={pendingZoneGeom?.zoneType || 'red'}
      />

      {/* 4. Officer Management Modal (Triggered from Dashboard or View) */}
      <OfficerManagementModal
        isOpen={isOfficerModalOpen}
        onClose={() => setIsOfficerModalOpen(false)}
        officers={officers}
        maps={maps}
        onRefresh={() => {}}
      />

      {/* 5. Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
