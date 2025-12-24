
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, Edit3, Sparkles, 
  ChevronLeft, ChevronRight, Activity, Fuel, Loader2, 
  Zap, MessageCircle, DollarSign, MapPin, 
  CheckCircle2, ShieldCheck, Star, 
  ArrowRight, X, Image as ImageIcon, Calendar, Camera
} from 'lucide-react';
import { Car, ViewType, CarType, LocationType } from './types';
import { generateCarImage } from './services/geminiService';

const INITIAL_CARS: Car[] = [
  {
    id: '1',
    make: 'Chevrolet',
    model: 'Silverado 1500',
    year: 2022,
    price: 45000,
    mileage: 32000,
    engine: '5.3L V8',
    transmission: 'Automática',
    fuelType: 'Gasolina',
    type: 'Troca',
    location: 'Houston',
    enganche: 3500,
    description: 'Unidad certificada por Texas Cars Approved. Esta Silverado combina potencia bruta con un interior refinado. Ideal para el trabajo exigente o viajes familiares con total seguridad.',
    imageUrls: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=1200'
    ],
    features: [],
    status: 'Disponible'
  },
  {
    id: '2',
    make: 'Toyota',
    model: 'Camry SE',
    year: 2023,
    price: 28000,
    mileage: 12000,
    engine: '2.5L I4',
    transmission: 'Automática',
    fuelType: 'Gasolina',
    type: 'Sedán',
    location: 'Dallas',
    enganche: 1300,
    description: 'El estándar de oro en confiabilidad. Este Camry SE ofrece un manejo deportivo con la eficiencia de combustible líder en su clase. Inspeccionado y aprobado para entrega inmediata.',
    imageUrls: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=1200'
    ],
    features: [],
    status: 'Disponible'
  }
];

const App: React.FC = () => {
  // Persistence
  const [cars, setCars] = useState<Car[]>(() => {
    const saved = localStorage.getItem('texas_cars_approved_db_vfinal');
    return saved ? JSON.parse(saved) : INITIAL_CARS;
  });
  
  const [ghlConfig, setGhlConfig] = useState(() => {
    const saved = localStorage.getItem('texas_cars_ghl_vfinal');
    return saved ? JSON.parse(saved) : { whatsappNumber: '1234567890' };
  });

  // Navigation State
  const [currentView, setCurrentView] = useState<ViewType>('grid');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGhlModalOpen, setIsGhlModalOpen] = useState(false);
  const [isFunnelOpen, setIsFunnelOpen] = useState(false);
  const [isClientMode, setIsClientMode] = useState(true);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Funnel State
  const [funnelStep, setFunnelStep] = useState(1);
  const [funnelData, setFunnelData] = useState({
    preferredLocation: ''
  });

  // Admin Form State
  const [formData, setFormData] = useState<Partial<Car>>({
    make: '', model: '', year: 2024, price: 0, mileage: 0, 
    engine: '', transmission: 'Automática', fuelType: 'Gasolina', 
    type: 'Sedán', location: 'Houston', enganche: 1300, status: 'Disponible', description: '',
    imageUrls: []
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('texas_cars_approved_db_vfinal', JSON.stringify(cars));
    localStorage.setItem('texas_cars_ghl_vfinal', JSON.stringify(ghlConfig));
  }, [cars, ghlConfig]);

  const filteredCars = useMemo(() => {
    return cars.filter(car => 
      car.make.toLowerCase().includes(searchQuery.toLowerCase()) || 
      car.model.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cars, searchQuery]);

  const handleReturnToWhatsApp = (location: string) => {
    if (!selectedCar) return;
    const message = `✅ *CITA PARA INVENTARIO APPROVED*%0A%0AHe validado la unidad: *${selectedCar.make} ${selectedCar.model} ${selectedCar.year}*%0A📍 *Sede elegida:* ${location}%0A💰 *Enganche:* $${selectedCar.enganche.toLocaleString()}%0A%0A*Por favor, confírmame disponibilidad para hoy mismo.*`;
    window.open(`https://wa.me/${ghlConfig.whatsappNumber}?text=${message}`);
    setIsFunnelOpen(false);
    setFunnelStep(1);
  };

  const handleSaveCar = () => {
    if (!formData.make || !formData.model) return alert("Datos incompletos.");
    if (formData.id) {
      setCars(cars.map(c => c.id === formData.id ? { ...c, ...formData } as Car : c));
    } else {
      const newCar = { ...formData, id: Date.now().toString(), features: [], imageUrls: formData.imageUrls || [] } as Car;
      setCars([newCar, ...cars]);
    }
    setIsModalOpen(false);
  };

  const handleAIGenerateImage = async () => {
    if (!formData.make || !formData.model) return alert("Indica marca y modelo para la IA.");
    setIsGeneratingImg(true);
    try {
      const url = await generateCarImage(formData);
      setFormData(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), url] }));
    } catch (e) { 
      alert("La IA está ocupada. Intenta de nuevo."); 
    } finally { 
      setIsGeneratingImg(false); 
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-600/30">
      {/* HEADER DINÁMICO */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-2xl border-b border-slate-800/50 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setCurrentView('grid'); setSelectedCar(null); }}>
          <div className="bg-blue-600 p-2.5 rounded-2xl transition-all group-hover:scale-105 shadow-xl shadow-blue-600/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none text-white">Texas Cars <span className="text-blue-500">Approved</span></h1>
            <span className="text-[9px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-0.5">Premium Inventory</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsClientMode(!isClientMode)} 
            className={`px-5 py-2.5 rounded-2xl text-[10px] font-black tracking-widest border transition-all active:scale-95 ${isClientMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            {isClientMode ? "VISTA PÚBLICA" : "PANEL ADMIN"}
          </button>
          {!isClientMode && (
            <div className="flex gap-2">
              <button onClick={() => setIsGhlModalOpen(true)} className="p-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-blue-400 hover:bg-slate-700 transition-colors">
                <Zap className="w-5 h-5" />
              </button>
              <button onClick={() => { setFormData({ make: '', model: '', year: 2024, price: 0, mileage: 0, engine: '', transmission: 'Automática', fuelType: 'Gasolina', type: 'Sedán', location: 'Houston', enganche: 1300, status: 'Disponible', description: '', imageUrls: [] }); setIsModalOpen(true); }} className="bg-blue-600 px-6 py-2.5 rounded-2xl text-[10px] font-black flex items-center gap-2 hover:bg-blue-500 transition-all text-white shadow-lg shadow-blue-600/20">
                <Plus className="w-4 h-4" /> AÑADIR UNIDAD
              </button>
            </div>
          )}
        </div>
      </header>

      {/* NAVEGACIÓN DE FLUJO */}
      <nav className="bg-slate-900/30 border-b border-slate-800/30 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-5 md:gap-16">
          {[
            { id: 'grid', label: 'Explora', active: currentView === 'grid' },
            { id: 'details', label: 'Valida', active: currentView === 'details' && !isFunnelOpen },
            { id: 'funnel', label: 'Cita', active: isFunnelOpen }
          ].map((nav, idx) => (
            <React.Fragment key={nav.id}>
              <div className={`flex items-center gap-3 transition-all ${nav.active ? 'text-blue-500 scale-105' : 'opacity-20'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${nav.active ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700'}`}>
                  {idx + 1}
                </div>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] hidden sm:block">{nav.label}</span>
              </div>
              {idx < 2 && <div className="w-8 md:w-16 h-px bg-slate-800/50"></div>}
            </React.Fragment>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {currentView === 'grid' && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* HERO SECTION */}
            <section className="bg-slate-900 rounded-[3.5rem] p-12 md:p-28 text-center border border-slate-800 shadow-3xl relative overflow-hidden group">
               <div className="relative z-10 space-y-8">
                  <div className="inline-flex items-center gap-2.5 bg-blue-600/10 text-blue-500 px-6 py-2 rounded-full border border-blue-500/20 text-[11px] font-black uppercase tracking-widest animate-pulse">
                    <Star className="w-3.5 h-3.5 fill-blue-500" /> Disponibilidad Inmediata
                  </div>
                  <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">
                    Inventario <span className="text-blue-500">Approved</span>
                  </h2>
                  <p className="text-slate-400 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed">
                    Unidades certificadas con el enganche más bajo de Texas. Selecciona tu unidad para agendar hoy mismo.
                  </p>
               </div>
               <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-[3s]" />
            </section>

            {/* BUSQUEDA */}
            <div className="relative max-w-2xl mx-auto group">
              <input 
                type="text" 
                placeholder="Busca marca, modelo o año..." 
                className="w-full bg-slate-900/40 border-2 border-slate-800 p-6 rounded-[2rem] text-white focus:border-blue-600 focus:bg-slate-900 outline-none transition-all shadow-2xl pl-16 text-lg font-medium"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <ImageIcon className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-600 w-6 h-6 group-focus-within:text-blue-500 transition-colors" />
            </div>

            {/* GRID CATÁLOGO */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredCars.map(car => (
                <div key={car.id} className="group bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-800/80 hover:border-blue-500/50 transition-all flex flex-col shadow-2xl hover:shadow-blue-500/5 active:scale-[0.98]">
                  <div className="relative h-80 overflow-hidden">
                    <img 
                      src={car.imageUrls[0] || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=800'} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      alt={car.model} 
                    />
                    <div className="absolute top-6 left-6 flex flex-col gap-2">
                       <div className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-[12px] font-black italic shadow-2xl border border-white/10">
                         ${car.enganche.toLocaleString()} DP
                       </div>
                    </div>
                  </div>
                  <div className="p-10 space-y-8 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black uppercase text-white tracking-tight group-hover:text-blue-400 transition-colors leading-none">{car.make} {car.model}</h3>
                      <div className="flex items-center gap-3 text-slate-500 text-[11px] font-black uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" /> {car.location} • {car.year}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => { setSelectedCar(car); setActiveImageIndex(0); setCurrentView('details'); window.scrollTo(0,0); }} 
                      className="mt-auto w-full bg-slate-800 hover:bg-blue-600 text-white py-6 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.25em] transition-all flex items-center justify-center gap-3 group active:scale-95 border border-slate-700 hover:border-blue-500"
                    >
                      Ver Detalles <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'details' && selectedCar && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <button 
              onClick={() => { setCurrentView('grid'); setSelectedCar(null); }} 
              className="flex items-center gap-3 text-slate-600 hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.4em] group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" /> Volver al catálogo
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              {/* GALERÍA PRO */}
              <div className="lg:col-span-7 space-y-8">
                <div className="relative rounded-[3.5rem] overflow-hidden bg-slate-900 border border-slate-800 aspect-[16/10] shadow-4xl group/gallery">
                  {selectedCar.imageUrls.length > 0 ? (
                    <img 
                      src={selectedCar.imageUrls[activeImageIndex]} 
                      className="w-full h-full object-cover transition-all duration-700" 
                      alt="Vista principal" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-800 opacity-20">
                      <ImageIcon className="w-24 h-24 mb-4" />
                      <span className="text-xs font-black uppercase tracking-widest">No Image available</span>
                    </div>
                  )}

                  <div className="absolute top-10 left-10">
                    <span className="bg-blue-600/90 backdrop-blur-xl text-white px-8 py-3 rounded-2xl text-[12px] font-black uppercase italic shadow-2xl border border-white/20">
                      Texas Approved Certified
                    </span>
                  </div>

                  {selectedCar.imageUrls.length > 1 && (
                    <>
                      <button 
                        onClick={() => setActiveImageIndex(prev => (prev - 1 + selectedCar.imageUrls.length) % selectedCar.imageUrls.length)} 
                        className="absolute left-8 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-blue-600 p-5 rounded-full text-white backdrop-blur-2xl transition-all opacity-0 group-hover/gallery:opacity-100 shadow-3xl"
                      >
                        <ChevronLeft className="w-7 h-7" />
                      </button>
                      <button 
                        onClick={() => setActiveImageIndex(prev => (prev + 1) % selectedCar.imageUrls.length)} 
                        className="absolute right-8 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-blue-600 p-5 rounded-full text-white backdrop-blur-2xl transition-all opacity-0 group-hover/gallery:opacity-100 shadow-3xl"
                      >
                        <ChevronRight className="w-7 h-7" />
                      </button>
                    </>
                  )}
                </div>

                {/* THUMBS */}
                {selectedCar.imageUrls.length > 1 && (
                  <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide px-2">
                    {selectedCar.imageUrls.map((url, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-40 h-24 rounded-[1.5rem] overflow-hidden flex-shrink-0 border-4 transition-all ${idx === activeImageIndex ? 'border-blue-600 scale-105 shadow-xl shadow-blue-600/20' : 'border-slate-900 opacity-40 hover:opacity-100'}`}
                      >
                        <img src={url} className="w-full h-full object-cover" alt="Thumb" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* DETALLES LADO DERECHO */}
              <div className="lg:col-span-5 space-y-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-blue-500 text-[12px] font-black uppercase tracking-[0.5em]">
                    <ShieldCheck className="w-5 h-5" /> Inspección Approved
                  </div>
                  <h1 className="text-6xl md:text-8xl font-black uppercase text-white leading-[0.85] tracking-tighter italic">
                    {selectedCar.make} <br/> {selectedCar.model}
                  </h1>
                  <p className="text-slate-500 text-2xl font-bold uppercase italic">{selectedCar.year} • {selectedCar.location} Hub</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] space-y-3 shadow-xl">
                    <Activity className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recorrido</p>
                      <p className="text-2xl font-black text-white">{selectedCar.mileage.toLocaleString()} KM</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] space-y-3 shadow-xl">
                    <Fuel className="w-6 h-6 text-blue-500" />
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motor / Caja</p>
                      <p className="text-2xl font-black text-white">{selectedCar.transmission}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 rounded-[2.5rem] p-10 border border-slate-800/40">
                   <p className="text-slate-300 leading-relaxed italic text-xl font-medium tracking-tight">
                     "{selectedCar.description}"
                   </p>
                </div>

                {/* CALL TO ACTION PREMIUM */}
                <div className="bg-white p-12 rounded-[4rem] shadow-4xl shadow-blue-500/10 space-y-10">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-8">
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Enganche Mínimo</p>
                      <p className="text-7xl font-black text-slate-950 tracking-tighter italic leading-none">${selectedCar.enganche.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-600/10 p-5 rounded-3xl">
                      <DollarSign className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { setIsFunnelOpen(true); setFunnelStep(1); }} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-8 rounded-[2rem] font-black uppercase text-lg tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-5 active:scale-95 group"
                  >
                    <MessageCircle className="w-7 h-7 group-hover:rotate-12 transition-transform" />
                    SOLICITAR CITA HOY
                  </button>
                  <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    * Disponibilidad sujeta a validación en sede.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL FUNNEL PASO FINAL */}
      {isFunnelOpen && selectedCar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[5rem] w-full max-w-2xl p-12 md:p-24 space-y-20 relative animate-in zoom-in-95 duration-500 shadow-4xl">
            <button onClick={() => setIsFunnelOpen(false)} className="absolute top-12 right-12 text-slate-600 hover:text-white transition-colors">
              <X className="w-10 h-10" />
            </button>
            
            {funnelStep === 1 ? (
              <div className="space-y-16 text-center">
                <div className="bg-blue-600/10 text-blue-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 shadow-2xl">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <div className="space-y-6">
                  <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Validación</h2>
                  <p className="text-slate-400 text-2xl font-medium leading-relaxed">
                    ¿Confirmas que cuentas con los <span className="text-white font-black">${selectedCar.enganche.toLocaleString()}</span> para apartar hoy tu unidad?
                  </p>
                </div>
                <button 
                  onClick={() => setFunnelStep(2)} 
                  className="w-full p-10 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase text-2xl tracking-widest shadow-3xl hover:bg-blue-500 transition-all active:scale-95"
                >
                  SÍ, CONFIRMO
                </button>
              </div>
            ) : (
              <div className="space-y-16 text-center">
                <div className="bg-blue-600/10 text-blue-500 w-32 h-32 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 shadow-2xl">
                  <MapPin className="w-16 h-16" />
                </div>
                <div className="space-y-6">
                  <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Sede de Visita</h2>
                  <p className="text-slate-400 text-2xl font-medium">¿A cuál de nuestras sedes te gustaría asistir?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <button 
                    onClick={() => handleReturnToWhatsApp('HOUSTON')} 
                    className="p-10 bg-slate-800 hover:bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest transition-all border border-slate-700 active:scale-95 shadow-xl"
                  >
                    HOUSTON HUB
                  </button>
                  <button 
                    onClick={() => handleReturnToWhatsApp('DALLAS')} 
                    className="p-10 bg-slate-800 hover:bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest transition-all border border-slate-700 active:scale-95 shadow-xl"
                  >
                    DALLAS HUB
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDITOR ADMIN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/98 backdrop-blur-xl overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[4rem] w-full max-w-5xl my-10 p-16 space-y-16 shadow-4xl relative animate-in slide-in-from-bottom-10 duration-500">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-12 right-12 text-slate-600 hover:text-white transition-colors">
              <X className="w-8 h-8" />
            </button>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Gestión de <span className="text-blue-500">Inventario</span></h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Marca</label>
                    <input type="text" placeholder="Chevrolet" className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Modelo</label>
                    <input type="text" placeholder="Silverado" className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Año</label>
                    <input type="number" className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Ubicación</label>
                    <select className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value as any})}>
                      <option value="Houston">Houston</option>
                      <option value="Dallas">Dallas</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Enganche Requerido ($)</label>
                  <input type="number" className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl text-blue-500 font-black text-2xl outline-none focus:border-blue-500 transition-all" value={formData.enganche} onChange={e => setFormData({...formData, enganche: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción de Venta</label>
                  <textarea rows={4} className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-[2rem] text-white outline-none focus:border-blue-500 transition-all italic font-medium" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              {/* MEDIA ADMIN */}
              <div className="space-y-8">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Multimedia Carrusel</label>
                <div className="grid grid-cols-3 gap-6">
                  {(formData.imageUrls || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-3xl overflow-hidden group/img border-2 border-slate-800">
                      <img src={url} className="w-full h-full object-cover" />
                      <button onClick={() => setFormData(f => ({ ...f, imageUrls: f.imageUrls?.filter((_, i) => i !== idx) }))} className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all text-white backdrop-blur-sm"><Trash2 className="w-8 h-8" /></button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all group active:scale-95">
                    <Plus className="w-10 h-10 text-blue-500 group-hover:scale-125 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Añadir</span>
                  </button>
                  <button onClick={handleAIGenerateImage} disabled={isGeneratingImg} className="aspect-square bg-slate-950 border-2 border-slate-800 rounded-3xl flex flex-col items-center justify-center gap-3 group disabled:opacity-50 active:scale-95 shadow-inner">
                    {isGeneratingImg ? <Loader2 className="animate-spin w-10 h-10 text-indigo-500" /> : <Sparkles className="w-10 h-10 text-indigo-500 group-hover:rotate-12 transition-transform" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Gemini IA</span>
                  </button>
                </div>
              </div>
            </div>
            <button onClick={handleSaveCar} className="w-full py-10 bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] font-black uppercase text-xl tracking-[0.3em] transition-all shadow-3xl shadow-blue-600/30 active:scale-[0.98]">
              Guardar Unidad en el Sistema
            </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const filesList = e.target.files;
            if (filesList) {
              const files: File[] = Array.from(filesList);
              files.forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => setFormData(f => ({ ...f, imageUrls: [...(f.imageUrls || []), reader.result as string] }));
                reader.readAsDataURL(file);
              });
            }
          }} />
        </div>
      )}

      {/* WHATSAPP CONFIG */}
      {isGhlModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl">
          <div className="bg-slate-900 border border-slate-800 rounded-[4rem] w-full max-w-md p-12 md:p-16 space-y-12 shadow-4xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-4">
              <MessageCircle className="text-blue-500 w-8 h-8" /> Config
            </h2>
            <div className="space-y-6">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-4">WhatsApp Receptor</label>
              <input 
                type="text" 
                placeholder="Ej: 12815555555" 
                className="w-full bg-slate-800 border-2 border-slate-700 p-8 rounded-[2rem] text-white outline-none focus:border-blue-500 font-mono text-xl" 
                value={ghlConfig.whatsappNumber} 
                onChange={e => setGhlConfig({...ghlConfig, whatsappNumber: e.target.value})} 
              />
            </div>
            <button onClick={() => setIsGhlModalOpen(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-8 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95">
              Guardar Cambios
            </button>
          </div>
        </div>
      )}
      
      <footer className="bg-slate-950 border-t border-slate-900 py-40 text-center opacity-30">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Texas Cars <span className="text-blue-500">Approved</span></h2>
        <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.8em] mt-6">Production v6.0 • Deployment Ready 2025</p>
      </footer>
    </div>
  );
};

export default App;
