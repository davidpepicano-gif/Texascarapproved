import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, Edit3, Sparkles, 
  ChevronLeft, ChevronRight, Activity, Fuel, Loader2, 
  Zap, MessageCircle, DollarSign, MapPin, 
  CheckCircle2, ShieldCheck, Star, 
  ArrowRight, X, Image as ImageIcon
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
    description: 'Esta Silverado es parte de nuestro Inventario Certificado Approved. Una unidad robusta, impecable y lista para el trabajo pesado o el uso diario.',
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
    description: 'El sedán más confiable del mercado. Unidad certificada con bajo millaje, ideal para quienes buscan economía de combustible y estilo.',
    imageUrls: [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&q=80&w=1200'
    ],
    features: [],
    status: 'Disponible'
  }
];

const App: React.FC = () => {
  const [cars, setCars] = useState<Car[]>(() => {
    const saved = localStorage.getItem('texas_cars_approved_db');
    return saved ? JSON.parse(saved) : INITIAL_CARS;
  });
  
  const [ghlConfig, setGhlConfig] = useState(() => {
    const saved = localStorage.getItem('texas_cars_ghl_v2');
    return saved ? JSON.parse(saved) : { webhookUrl: '', calendarUrl: '', whatsappNumber: '1234567890' };
  });

  const [currentView, setCurrentView] = useState<ViewType>('grid');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter] = useState<'Todos' | CarType>('Todos');
  const [activeLocation] = useState<'Todas' | LocationType>('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGhlModalOpen, setIsGhlModalOpen] = useState(false);
  const [isFunnelOpen, setIsFunnelOpen] = useState(false);
  const [isClientMode, setIsClientMode] = useState(true);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [funnelStep, setFunnelStep] = useState(1);
  const [funnelData, setFunnelData] = useState({
    readyDownPayment: '',
    visitTime: '',
    preferredLocation: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Car>>({
    make: '', model: '', year: 2024, price: 0, mileage: 0, 
    engine: '', transmission: 'Automática', fuelType: 'Gasolina', 
    type: 'Sedán', location: 'Houston', enganche: 1300, status: 'Disponible', description: '',
    imageUrls: []
  });

  useEffect(() => {
    localStorage.setItem('texas_cars_approved_db', JSON.stringify(cars));
    localStorage.setItem('texas_cars_ghl_v2', JSON.stringify(ghlConfig));
  }, [cars, ghlConfig]);

  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const matchesSearch = car.make.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            car.model.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeFilter === 'Todos' || car.type === activeFilter;
      const matchesLoc = activeLocation === 'Todas' || car.location === activeLocation;
      return matchesSearch && matchesType && matchesLoc;
    });
  }, [cars, searchQuery, activeFilter, activeLocation]);

  const handleReturnToWhatsApp = () => {
    if (!selectedCar) return;
    const message = `✅ *CITA PARA UNIDAD APPROVED*%0A%0AUnidad: *${selectedCar.make} ${selectedCar.model} ${selectedCar.year}*%0A📍 Sede: ${funnelData.preferredLocation}%0A💰 Enganche: $${selectedCar.enganche.toLocaleString()}%0A⏰ Tiempo: ${funnelData.visitTime}%0A%0A*He validado el enganche y deseo agendar mi visita.*`;
    window.open(`https://wa.me/${ghlConfig.whatsappNumber}?text=${message}`);
    setIsFunnelOpen(false);
    setFunnelStep(1);
  };

  const handleSaveCar = () => {
    if (!formData.make || !formData.model) return alert("Completa marca y modelo.");
    if (formData.id) {
      setCars(cars.map(c => c.id === formData.id ? { ...c, ...formData } as Car : c));
    } else {
      const newCar = { ...formData, id: Date.now().toString(), features: [], imageUrls: formData.imageUrls || [] } as Car;
      setCars([...cars, newCar]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteCar = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este vehículo del inventario?')) {
      setCars(cars.filter(c => c.id !== id));
    }
  };

  const handleEditCar = (car: Car) => {
    setFormData(car);
    setIsModalOpen(true);
  };

  const handleAIGenerateImage = async () => {
    if (!formData.make || !formData.model) return alert("Ingresa marca y modelo.");
    setIsGeneratingImg(true);
    try {
      const url = await generateCarImage(formData);
      setFormData(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), url] }));
    } catch (e) { alert("Error IA."); }
    finally { setIsGeneratingImg(false); }
  };

  const nextImage = () => {
    if (!selectedCar) return;
    setActiveImageIndex((prev) => (prev + 1) % selectedCar.imageUrls.length);
  };

  const prevImage = () => {
    if (!selectedCar) return;
    setActiveImageIndex((prev) => (prev - 1 + selectedCar.imageUrls.length) % selectedCar.imageUrls.length);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-600/30">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('grid')}>
          <div className="bg-blue-600 p-2 rounded-xl transition-all group-hover:bg-blue-500 shadow-lg shadow-blue-600/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic text-white">Texas Cars <span className="text-blue-500">Approved</span></h1>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsClientMode(!isClientMode)} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${isClientMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            {isClientMode ? "VISTA PÚBLICA" : "MODO ADMIN"}
          </button>
          {!isClientMode && (
            <div className="flex gap-2">
               <button onClick={() => setIsGhlModalOpen(true)} className="p-2 bg-slate-800 border border-slate-700 rounded-xl text-blue-400"><Zap className="w-4 h-4"/></button>
               <button onClick={() => { setFormData({ make: '', model: '', year: 2024, price: 0, mileage: 0, engine: '', transmission: 'Automática', fuelType: 'Gasolina', type: 'Sedán', location: 'Houston', enganche: 1300, status: 'Disponible', description: '', imageUrls: [] }); setIsModalOpen(true); }} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-blue-500 transition-all text-white"><Plus className="w-4 h-4" /> AÑADIR</button>
            </div>
          )}
        </div>
      </header>

      {/* PROCESO */}
      <nav className="bg-slate-900/40 border-b border-slate-800/50 py-3">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-4 md:gap-12">
          {[
            { step: 1, label: 'Catálogo', active: currentView === 'grid' },
            { step: 2, label: 'Validación', active: currentView === 'details' && !isFunnelOpen },
            { step: 3, label: 'Cita', active: isFunnelOpen }
          ].map((item, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-2 transition-all ${item.active ? 'text-blue-500 scale-105' : 'opacity-20'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${item.active ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>{item.step}</div>
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </div>
              {i < 2 && <div className="w-6 h-px bg-slate-800"></div>}
            </React.Fragment>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {currentView === 'grid' && (
          <div className="space-y-12 animate-in fade-in duration-500">
            {/* HERO */}
            <section className="bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center border border-slate-800 shadow-2xl relative overflow-hidden group">
               <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-500 px-4 py-1.5 rounded-full border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                    <Star className="w-3 h-3 fill-blue-500" /> Selección Texas Hub
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">Inventario <span className="text-blue-500">Certificado</span></h2>
                  <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium">Elige tu unidad Approved para validar enganche y agendar visita.</p>
               </div>
               <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000" />
            </section>

            {/* BUSQUEDA */}
            <div className="relative max-w-xl mx-auto">
              <input 
                type="text" 
                placeholder="Busca por marca o modelo..." 
                className="w-full bg-slate-900/50 border border-slate-800 p-5 rounded-2xl text-white focus:border-blue-500 outline-none transition-all shadow-inner pl-14"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
            </div>

            {/* GRID CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {filteredCars.map(car => (
                <div key={car.id} className="group bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col shadow-xl hover:shadow-blue-500/5 relative">
                  
                  {/* ADMIN CONTROLS */}
                  {!isClientMode && (
                    <div className="absolute top-4 right-4 z-30 flex gap-2">
                       <button onClick={(e) => { e.stopPropagation(); handleEditCar(car); }} className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-2 rounded-xl text-white border border-white/10 shadow-lg transition-all hover:scale-110">
                         <Edit3 className="w-4 h-4" />
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); handleDeleteCar(car.id); }} className="bg-red-600/80 hover:bg-red-600 p-2 rounded-xl text-white backdrop-blur-md border border-red-500/20 shadow-lg transition-all hover:scale-110">
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  )}

                  <div className="relative h-72 overflow-hidden">
                    <img src={car.imageUrls[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={car.model} />
                    <div className="absolute top-5 left-5">
                       <div className="bg-blue-600 text-white px-5 py-2 rounded-2xl text-[11px] font-black italic shadow-2xl border border-white/10">
                         ${car.enganche.toLocaleString()} DP
                       </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-8 flex-1 flex flex-col">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black uppercase text-white group-hover:text-blue-400 transition-colors leading-none">{car.make} {car.model}</h3>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                        <MapPin className="w-3 h-3" /> {car.location} • {car.year}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => { setSelectedCar(car); setActiveImageIndex(0); setCurrentView('details'); }} 
                      className="mt-auto w-full bg-slate-800 hover:bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 group active:scale-95 border border-slate-700 hover:border-blue-500"
                    >
                      Validar Unidad <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
              onClick={() => setCurrentView('grid')} 
              className="flex items-center gap-2 text-slate-600 hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.3em] group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Volver al catálogo
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* GALERÍA FIJA Y VISIBLE */}
              <div className="lg:col-span-7 space-y-6">
                <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 border border-slate-800 aspect-[16/10] shadow-3xl">
                  {selectedCar.imageUrls.length > 0 ? (
                    <img 
                      src={selectedCar.imageUrls[activeImageIndex]} 
                      className="w-full h-full object-cover transition-all duration-500" 
                      alt="Vista de unidad" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-800">
                      <ImageIcon className="w-20 h-20 mb-4 opacity-10" />
                      <span className="text-xs font-black uppercase tracking-widest">Sin imagen</span>
                    </div>
                  )}

                  {/* Badges en Galería */}
                  <div className="absolute top-8 left-8">
                    <span className="bg-blue-600/90 backdrop-blur-md text-white px-6 py-2 rounded-xl text-[11px] font-black uppercase italic shadow-2xl border border-white/20">
                      Certified Approved
                    </span>
                  </div>

                  {/* Flechas Navegación */}
                  {selectedCar.imageUrls.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-blue-600 p-4 rounded-full text-white backdrop-blur-xl transition-all active:scale-90 shadow-2xl border border-white/5">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-blue-600 p-4 rounded-full text-white backdrop-blur-xl transition-all active:scale-90 shadow-2xl border border-white/5">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>

                {/* MINIATURAS CLEAN */}
                {selectedCar.imageUrls.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                    {selectedCar.imageUrls.map((url, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-32 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-4 transition-all ${idx === activeImageIndex ? 'border-blue-600 scale-105 shadow-lg' : 'border-slate-900 opacity-40 hover:opacity-70'}`}
                      >
                        <img src={url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* INFO LIMPIA */}
              <div className="lg:col-span-5 space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-blue-500 text-[11px] font-black uppercase tracking-[0.4em]">
                    <ShieldCheck className="w-4 h-4" /> Texas Approved Hub
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black uppercase text-white leading-[0.9] tracking-tighter">
                    {selectedCar.make} <br/> {selectedCar.model}
                  </h1>
                  <p className="text-slate-500 text-xl font-bold uppercase italic">{selectedCar.year} • Sede {selectedCar.location}</p>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Millaje</p>
                      <p className="text-xl font-black text-white">{selectedCar.mileage.toLocaleString()} KM</p>
                    </div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-2">
                    <Fuel className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Transmisión</p>
                      <p className="text-xl font-black text-white">{selectedCar.transmission}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-3xl p-8 border border-slate-800/50">
                   <p className="text-slate-300 leading-relaxed italic text-lg font-medium">"{selectedCar.description}"</p>
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-3xl shadow-blue-500/10 space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enganche Requerido</p>
                      <p className="text-6xl font-black text-slate-950 tracking-tighter italic leading-none">${selectedCar.enganche.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-600/10 p-4 rounded-2xl">
                      <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { setIsFunnelOpen(true); setFunnelStep(1); }} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-black uppercase text-sm tracking-[0.2em] transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-4 active:scale-95 group"
                  >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    AGENDAR CITA AHORA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL EMBUDO AGENDAR */}
      {isFunnelOpen && selectedCar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/98 backdrop-blur-2xl">
          <div className="bg-slate-900 border border-slate-800 rounded-[4rem] w-full max-w-2xl p-12 md:p-20 space-y-16 relative animate-in zoom-in-95 duration-500 shadow-2xl">
            <button onClick={() => setIsFunnelOpen(false)} className="absolute top-10 right-10 text-slate-600 hover:text-white transition-colors">
              <X className="w-8 h-8" />
            </button>
            
            {funnelStep === 1 ? (
              <div className="space-y-12 text-center">
                <div className="bg-blue-600/10 text-blue-500 w-28 h-28 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Reserva de Unidad</h2>
                  <p className="text-slate-400 text-xl font-medium">¿Confirmas que tienes los <span className="text-white font-black">${selectedCar.enganche.toLocaleString()}</span> listos para el enganche?</p>
                </div>
                <button 
                  onClick={() => setFunnelStep(2)} 
                  className="w-full p-8 bg-blue-600 text-white rounded-3xl font-black uppercase text-xl tracking-wider shadow-2xl hover:bg-blue-500 transition-all active:scale-95"
                >
                  Sí, Confirmado
                </button>
              </div>
            ) : (
              <div className="space-y-12 text-center">
                <div className="bg-blue-600/10 text-blue-500 w-28 h-28 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                  <MapPin className="w-12 h-12" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">Sede de Visita</h2>
                  <p className="text-slate-400 text-xl font-medium">¿A cuál de nuestras sedes deseas asistir?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button 
                    onClick={() => { setFunnelData({...funnelData, preferredLocation: 'Houston', visitTime: 'Hoy'}); handleReturnToWhatsApp(); }} 
                    className="p-8 bg-slate-800 hover:bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest transition-all border border-slate-700 active:scale-95"
                  >
                    HOUSTON HUB
                  </button>
                  <button 
                    onClick={() => { setFunnelData({...funnelData, preferredLocation: 'Dallas', visitTime: 'Hoy'}); handleReturnToWhatsApp(); }} 
                    className="p-8 bg-slate-800 hover:bg-blue-600 text-white rounded-3xl font-black uppercase tracking-widest transition-all border border-slate-700 active:scale-95"
                  >
                    DALLAS HUB
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDITOR (ADMIN ONLY) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/98 backdrop-blur-md overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-5xl my-8 p-12 space-y-12 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 text-slate-600 hover:text-white"><X className="w-6 h-6" /></button>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Gestionar <span className="text-blue-500">Unidad</span></h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Marca</label>
                    <input type="text" placeholder="Chevrolet" className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modelo</label>
                    <input type="text" placeholder="Silverado" className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none focus:border-blue-500 transition-all" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Año</label>
                    <input type="number" className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sede</label>
                    <select className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value as any})}>
                      <option value="Houston">Houston</option>
                      <option value="Dallas">Dallas</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Enganche ($)</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-blue-500 font-black text-xl outline-none" value={formData.enganche} onChange={e => setFormData({...formData, enganche: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción</label>
                  <textarea rows={4} className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-white outline-none italic" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Multimedia (Carrusel)</label>
                <div className="grid grid-cols-3 gap-5">
                  {(formData.imageUrls || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group/img border border-slate-800">
                      <img src={url} className="w-full h-full object-cover" />
                      <button onClick={() => setFormData(f => ({ ...f, imageUrls: f.imageUrls?.filter((_, i) => i !== idx) }))} className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all text-white"><Trash2 className="w-6 h-6" /></button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all group">
                    <Plus className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase">Subir</span>
                  </button>
                  <button onClick={handleAIGenerateImage} disabled={isGeneratingImg} className="aspect-square bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 group disabled:opacity-50">
                    {isGeneratingImg ? <Loader2 className="animate-spin w-8 h-8 text-indigo-500" /> : <Sparkles className="w-8 h-8 text-indigo-500" />}
                    <span className="text-[9px] font-black uppercase">Gemini IA</span>
                  </button>
                </div>
              </div>
            </div>
            <button onClick={handleSaveCar} className="w-full py-8 bg-blue-600 hover:bg-blue-500 text-white rounded-3xl font-black uppercase tracking-widest transition-all">
              {formData.id ? 'Actualizar Vehículo' : 'Publicar en el Catálogo'}
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-md p-12 space-y-10 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3"><Zap className="text-blue-500" /> WhatsApp Hub</h2>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Número Receptor</label>
              <input type="text" placeholder="12815555555" className="w-full bg-slate-800 border border-slate-700 p-6 rounded-2xl text-white outline-none focus:border-blue-500 font-mono" value={ghlConfig.whatsappNumber} onChange={e => setGhlConfig({...ghlConfig, whatsappNumber: e.target.value})} />
            </div>
            <button onClick={() => setIsGhlModalOpen(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Guardar Cambios</button>
          </div>
        </div>
      )}
      
      <footer className="bg-slate-950 border-t border-slate-900 py-32 text-center opacity-40">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Texas Cars <span className="text-blue-500">Approved</span></h2>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mt-4">Sistema v6.0 • Professional Deployment 2025</p>
      </footer>
    </div>
  );
};

export default App;