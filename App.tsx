
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
    description: '¡Approved! Esta Silverado es parte de nuestro Inventario Certificado Approved en Texas. Llévatela hoy mismo con un enganche de $3,500 en nuestra sede de Houston.',
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
    description: 'Unidad de nuestro Inventario Certificado Approved. El sedán más confiable en Dallas. Estrénalo con solo $1,300 de enganche. Economía y estilo garantizado.',
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
    const message = `✅ *CONFIRMACIÓN DE CITA - INVENTARIO CERTIFICADO APPROVED*%0A%0AHe revisado los detalles del *${selectedCar.make} ${selectedCar.model} ${selectedCar.year}* y quiero agendar mi visita.%0A%0A📍 *Sede:* ${funnelData.preferredLocation}%0A💰 *Enganche Validado:* $${selectedCar.enganche.toLocaleString()}%0A⏰ *Preferencia:* ${funnelData.visitTime}%0A%0A*Por favor, envíame la dirección exacta para mi cita.*`;
    
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('grid')}>
          <div className="bg-blue-600 p-2 rounded-lg transition-transform group-hover:scale-105">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="leading-none">
            <h1 className="text-lg font-black tracking-tighter uppercase italic text-white">Texas Cars <span className="text-blue-500">Approved</span></h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsClientMode(!isClientMode)} 
            className={`px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest border transition-all ${isClientMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            {isClientMode ? "VISTA PÚBLICA" : "ADMIN"}
          </button>
          {!isClientMode && (
            <button onClick={() => { setFormData({ make: '', model: '', year: 2024, price: 0, mileage: 0, engine: '', transmission: 'Automática', fuelType: 'Gasolina', type: 'Sedán', location: 'Houston', enganche: 1300, status: 'Disponible', description: '', imageUrls: [] }); setIsModalOpen(true); }} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-blue-500 transition-all text-white"><Plus className="w-4 h-4" /> AÑADIR</button>
          )}
        </div>
      </header>

      {/* Indicador de Proceso Simplificado */}
      <div className="bg-slate-900/50 border-b border-slate-800 py-3">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-6 md:gap-16">
          <div className={`flex items-center gap-2 ${currentView === 'grid' ? 'text-blue-500' : 'opacity-30'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentView === 'grid' ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>1</div>
            <span className="text-[10px] font-black uppercase tracking-wider">Explora</span>
          </div>
          <div className="w-8 h-px bg-slate-800"></div>
          <div className={`flex items-center gap-2 ${currentView === 'details' && !isFunnelOpen ? 'text-blue-500' : 'opacity-30'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${currentView === 'details' && !isFunnelOpen ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>2</div>
            <span className="text-[10px] font-black uppercase tracking-wider">Valida</span>
          </div>
          <div className="w-8 h-px bg-slate-800"></div>
          <div className={`flex items-center gap-2 ${isFunnelOpen ? 'text-green-500' : 'opacity-30'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isFunnelOpen ? 'bg-green-600 text-white' : 'bg-slate-800'}`}>3</div>
            <span className="text-[10px] font-black uppercase tracking-wider">Cita</span>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        {currentView === 'grid' && (
          <div className="space-y-12 animate-in fade-in duration-700">
            {/* Hero Minimal */}
            <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-20 text-center border border-slate-800 relative overflow-hidden">
               <div className="relative z-10 space-y-4">
                  <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">Inventario Certificado</h2>
                  <p className="text-slate-400 text-lg max-w-2xl mx-auto">Selecciona la unidad que te interesa para validar el enganche y agendar tu visita.</p>
               </div>
               <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                <ShieldCheck className="w-64 h-64" />
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCars.map(car => (
                <div key={car.id} className="group bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col shadow-xl">
                  <div className="relative h-64">
                    <img src={car.imageUrls[0] || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200'} className="w-full h-full object-cover" alt={car.model} />
                    <div className="absolute top-4 left-4">
                       <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black italic shadow-lg">
                         ${car.enganche.toLocaleString()} DP
                       </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-6 flex-1 flex flex-col">
                    <div>
                      <h3 className="text-xl font-black uppercase text-white">{car.make} {car.model}</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase mt-1">{car.location} • {car.year}</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedCar(car); setActiveImageIndex(0); setCurrentView('details'); }} 
                      className="mt-auto w-full bg-slate-800 hover:bg-blue-600 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2 group"
                    >
                      Detalles <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'details' && selectedCar && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Botón Volver Limpio */}
            <button 
              onClick={() => setCurrentView('grid')} 
              className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Volver al Inventario
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Columna Galería (Simplificada) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 border border-slate-800 aspect-[16/10] shadow-2xl">
                  {/* Foto Principal - Lógica de visibilidad arreglada */}
                  <div className="w-full h-full">
                    {selectedCar.imageUrls && selectedCar.imageUrls.length > 0 ? (
                      <img 
                        src={selectedCar.imageUrls[activeImageIndex]} 
                        className="w-full h-full object-cover transition-opacity duration-300" 
                        alt={`${selectedCar.make} ${selectedCar.model}`} 
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-900">
                        <ImageIcon className="w-16 h-16 mb-2" />
                        <span className="text-xs font-black uppercase">Sin imagen disponible</span>
                      </div>
                    )}
                  </div>

                  {/* Badges Minimalistas */}
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase italic shadow-lg">
                      Certified Approved
                    </div>
                  </div>

                  {/* Controles de Navegación */}
                  {selectedCar.imageUrls.length > 1 && (
                    <>
                      <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-blue-600 p-3 rounded-full text-white backdrop-blur-md transition-all active:scale-90 shadow-xl border border-white/5">
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-blue-600 p-3 rounded-full text-white backdrop-blur-md transition-all active:scale-90 shadow-xl border border-white/5">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Miniaturas Limpias */}
                {selectedCar.imageUrls.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {selectedCar.imageUrls.map((url, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-24 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${idx === activeImageIndex ? 'border-blue-500 scale-105' : 'border-slate-800 opacity-50'}`}
                      >
                        <img src={url} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Columna Información (Limpia & Blanca) */}
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest mb-2">
                    <Star className="w-3 h-3 fill-blue-500" /> Unidad Seleccionada
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black uppercase text-white leading-tight">
                    {selectedCar.make} <br/> {selectedCar.model}
                  </h1>
                  <p className="text-slate-500 text-lg font-bold uppercase italic">Modelo {selectedCar.year} • {selectedCar.location}</p>
                </div>

                {/* Grid de Specs Minimalistas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Recorrido</p>
                      <p className="text-lg font-black text-white">{selectedCar.mileage.toLocaleString()} KM</p>
                    </div>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-2xl flex items-center gap-4">
                    <div className="p-2 bg-blue-600/10 rounded-lg text-blue-500">
                      <Fuel className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">Caja</p>
                      <p className="text-lg font-black text-white">{selectedCar.transmission}</p>
                    </div>
                  </div>
                </div>

                {/* Reseña Limpia */}
                <div className="bg-slate-900/30 rounded-2xl p-6 border border-slate-800/50">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <Sparkles className="w-3 h-3 text-blue-500" /> Reseña Approved
                   </p>
                   <p className="text-slate-300 leading-relaxed italic text-sm">"{selectedCar.description}"</p>
                </div>

                {/* Caja de Enganche y Acción Principal */}
                <div className="bg-slate-900 border-2 border-slate-800 p-8 rounded-[2rem] shadow-2xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Enganche</p>
                      <p className="text-5xl font-black text-white tracking-tighter italic">${selectedCar.enganche.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <span className="inline-block bg-green-600/10 text-green-500 px-3 py-1 rounded-md text-[9px] font-black uppercase">Entrega Inmediata</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { setIsFunnelOpen(true); setFunnelStep(1); }} 
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-5 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-xl shadow-green-600/10 flex items-center justify-center gap-3 active:scale-95 group"
                  >
                    <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Agendar Cita en WhatsApp
                  </button>
                  
                  <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                    * Validación necesaria de documentos en sede.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL EMBUDO (Paso Final) */}
      {isFunnelOpen && selectedCar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-xl p-10 md:p-16 space-y-12 relative animate-in zoom-in-95 duration-300 shadow-2xl">
            <button onClick={() => setIsFunnelOpen(false)} className="absolute top-8 right-8 text-slate-600 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
            
            {funnelStep === 1 ? (
              <div className="space-y-10 text-center">
                <div className="bg-blue-600/10 text-blue-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                  <DollarSign className="w-10 h-10" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Reserva de Unidad</h2>
                  <p className="text-slate-400 text-lg">¿Cuentas con los <span className="text-white font-black">${selectedCar.enganche.toLocaleString()}</span> de enganche para apartar hoy tu {selectedCar.model}?</p>
                </div>
                <button 
                  onClick={() => setFunnelStep(2)} 
                  className="w-full p-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-lg tracking-wider shadow-lg hover:bg-blue-500 transition-all active:scale-95"
                >
                  Sí, los tengo listos
                </button>
              </div>
            ) : (
              <div className="space-y-10 text-center">
                <div className="bg-blue-600/10 text-blue-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                  <MapPin className="w-10 h-10" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Confirma Sede</h2>
                  <p className="text-slate-400 text-lg">¿A qué sede te gustaría acudir hoy?</p>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => { setFunnelData({...funnelData, preferredLocation: 'Houston', visitTime: 'Hoy'}); handleReturnToWhatsApp(); }} 
                    className="p-6 bg-slate-800 hover:bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-slate-700 active:scale-95"
                  >
                    HOUSTON Hub
                  </button>
                  <button 
                    onClick={() => { setFunnelData({...funnelData, preferredLocation: 'Dallas', visitTime: 'Hoy'}); handleReturnToWhatsApp(); }} 
                    className="p-6 bg-slate-800 hover:bg-green-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all border border-slate-700 active:scale-95"
                  >
                    DALLAS Hub
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDITOR MODAL (Admin) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-4xl my-8 p-10 space-y-10 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 text-slate-600 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Gestión de <span className="text-blue-500">Unidad</span></h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Marca</label>
                    <input type="text" placeholder="Chevrolet" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm font-bold text-white focus:border-blue-500 outline-none transition-all" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modelo</label>
                    <input type="text" placeholder="Silverado" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm font-bold text-white focus:border-blue-500 outline-none transition-all" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Año</label>
                    <input type="number" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm font-bold text-white focus:border-blue-500 outline-none transition-all" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sede</label>
                    <select className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm font-bold text-white focus:border-blue-500 outline-none transition-all cursor-pointer" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value as any})}>
                      <option value="Houston">Houston</option>
                      <option value="Dallas">Dallas</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Enganche ($)</label>
                  <input type="number" placeholder="1500" className="w-full bg-slate-800 border border-slate-700 p-4 rounded-xl text-sm font-black text-blue-500 focus:border-blue-500 outline-none transition-all" value={formData.enganche} onChange={e => setFormData({...formData, enganche: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Descripción</label>
                  <textarea placeholder="Detalles de la unidad..." rows={4} className="w-full bg-slate-800 border border-slate-700 p-5 rounded-2xl text-sm font-medium leading-relaxed italic text-white focus:border-blue-500 outline-none transition-all" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              </div>

              {/* Multimedia Admin */}
              <div className="space-y-6">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fotos (Carrusel)</label>
                <div className="grid grid-cols-3 gap-4">
                  {(formData.imageUrls || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group/img border border-slate-800">
                      <img src={url} className="w-full h-full object-cover" />
                      <button onClick={() => setFormData(f => ({ ...f, imageUrls: f.imageUrls?.filter((_, i) => i !== idx) }))} className="absolute inset-0 bg-red-600/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all text-white backdrop-blur-sm"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))}
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="aspect-square bg-slate-800/50 hover:bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center gap-2 transition-all text-white group active:scale-95"
                  >
                    <Plus className="w-6 h-6 text-blue-500" />
                    <span className="text-[9px] font-black uppercase">Subir</span>
                  </button>
                  <button 
                    onClick={handleAIGenerateImage} 
                    disabled={isGeneratingImg} 
                    className="aspect-square bg-slate-900 border border-slate-800 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center gap-2 transition-all text-white disabled:opacity-50 active:scale-95 group shadow-inner"
                  >
                    {isGeneratingImg ? <Loader2 className="animate-spin w-6 h-6 text-indigo-500" /> : <Sparkles className="w-6 h-6 text-indigo-500" />}
                    <span className="text-[9px] font-black uppercase">IA</span>
                  </button>
                </div>
              </div>
            </div>
            <button 
              onClick={handleSaveCar} 
              className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-sm tracking-widest transition-all active:scale-[0.98]"
            >
              Publicar Cambios
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

      {/* WhatsApp Config Modal */}
      {isGhlModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md transition-opacity">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-md p-12 space-y-10 shadow-2xl animate-in zoom-in-95">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3"><Zap className="text-blue-500" /> WhatsApp</h2>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Número de Recepción</label>
              <input type="text" placeholder="Ej: 12815555555" className="w-full bg-slate-800 border border-slate-700 p-6 rounded-2xl text-sm font-mono outline-none text-white focus:border-blue-500 shadow-inner" value={ghlConfig.whatsappNumber} onChange={e => setGhlConfig({...ghlConfig, whatsappNumber: e.target.value})} />
            </div>
            <button onClick={() => setIsGhlModalOpen(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Guardar</button>
          </div>
        </div>
      )}
      
      <footer className="bg-slate-950 border-t border-slate-900 py-20 text-center opacity-30">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em]">Texas Cars Approved • Houston & Dallas • 2025</p>
      </footer>
    </div>
  );
};

export default App;
