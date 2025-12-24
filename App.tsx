
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Trash2, Edit3, Sparkles, 
  ChevronLeft, ChevronRight, Activity, Fuel, Loader2, 
  Zap, MessageCircle, DollarSign, MapPin, 
  CheckCircle2, ShieldCheck, Star, 
  ArrowRight, X, Image as ImageIcon, Calendar, Camera
} from 'lucide-react';
import { Car, ViewType } from './types.ts';
import { generateCarImage } from './services/geminiService.ts';

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
  const [cars, setCars] = useState<Car[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('texas_cars_v9') : null;
      return saved ? JSON.parse(saved) : INITIAL_CARS;
    } catch (e) {
      return INITIAL_CARS;
    }
  });
  
  const [ghlConfig, setGhlConfig] = useState(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('texas_ghl_v9') : null;
      return saved ? JSON.parse(saved) : { whatsappNumber: '12815555555' };
    } catch (e) {
      return { whatsappNumber: '12815555555' };
    }
  });

  const [currentView, setCurrentView] = useState<ViewType>('grid');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGhlModalOpen, setIsGhlModalOpen] = useState(false);
  const [isFunnelOpen, setIsFunnelOpen] = useState(false);
  const [isClientMode, setIsClientMode] = useState(true);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Car>>({
    make: '', model: '', year: 2024, price: 0, mileage: 0, 
    engine: '', transmission: 'Automática', fuelType: 'Gasolina', 
    type: 'Sedán', location: 'Houston', enganche: 1300, status: 'Disponible', description: '',
    imageUrls: []
  });

  useEffect(() => {
    localStorage.setItem('texas_cars_v9', JSON.stringify(cars));
    localStorage.setItem('texas_ghl_v9', JSON.stringify(ghlConfig));
  }, [cars, ghlConfig]);

  const filteredCars = useMemo(() => {
    return cars.filter(car => 
      car.make.toLowerCase().includes(searchQuery.toLowerCase()) || 
      car.model.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cars, searchQuery]);

  const handleReturnToWhatsApp = (location: string) => {
    if (!selectedCar) return;
    const message = `✅ *CITA PARA INVENTARIO APPROVED*%0A%0AUnidad: *${selectedCar.make} ${selectedCar.model} ${selectedCar.year}*%0A📍 *Sede:* ${location}%0A💰 *Enganche:* $${selectedCar.enganche.toLocaleString()}%0A%0A*Confírmame si puedo pasar hoy mismo.*`;
    window.open(`https://wa.me/${ghlConfig.whatsappNumber}?text=${message}`);
    setIsFunnelOpen(false);
  };

  const handleSaveCar = () => {
    if (!formData.make || !formData.model) return alert("Indica marca y modelo.");
    if (formData.id) {
      setCars(cars.map(c => c.id === formData.id ? { ...c, ...formData } as Car : c));
    } else {
      const newCar = { ...formData, id: Date.now().toString(), features: [], imageUrls: formData.imageUrls || [] } as Car;
      setCars([newCar, ...cars]);
    }
    setIsModalOpen(false);
  };

  const handleAIGenerateImage = async () => {
    if (!formData.make || !formData.model) return alert("Marca y modelo necesarios.");
    setIsGeneratingImg(true);
    try {
      const url = await generateCarImage(formData);
      setFormData(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), url] }));
    } catch (e) { 
      alert("IA ocupada, intenta de nuevo."); 
    } finally { 
      setIsGeneratingImg(false); 
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setCurrentView('grid'); setSelectedCar(null); }}>
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-600/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none text-white">Texas Cars <span className="text-blue-500">Approved</span></h1>
            <p className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-1">Premium Inventory</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsClientMode(!isClientMode)} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${isClientMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            {isClientMode ? "CLIENTE" : "ADMIN"}
          </button>
          {!isClientMode && (
            <div className="flex gap-2">
              <button onClick={() => setIsGhlModalOpen(true)} className="p-2.5 bg-slate-800 rounded-xl text-blue-400 hover:bg-slate-700 transition-colors">
                <Zap className="w-5 h-5" />
              </button>
              <button onClick={() => { setFormData({ make: '', model: '', year: 2024, price: 0, mileage: 0, engine: '', transmission: 'Automática', fuelType: 'Gasolina', type: 'Sedán', location: 'Houston', enganche: 1300, status: 'Disponible', description: '', imageUrls: [] }); setIsModalOpen(true); }} className="bg-blue-600 px-5 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 text-white hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
                <Plus className="w-4 h-4" /> UNIDAD
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {currentView === 'grid' && (
          <div className="space-y-12 fade-in">
            {/* HERO SECTION */}
            <section className="bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center border border-slate-800 shadow-3xl relative overflow-hidden group">
               <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2.5 bg-blue-600/10 text-blue-500 px-5 py-2 rounded-full border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                    <Star className="w-4 h-4 fill-blue-500" /> Selección Texas Approved
                  </div>
                  <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-[0.9]">
                    Inventario <br/> <span className="text-blue-500 text-shadow-blue">Certificado</span>
                  </h2>
                  <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
                    Unidades validadas mecánicamente con entrega inmediata en Houston y Dallas.
                  </p>
               </div>
               <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] opacity-[0.02] pointer-events-none group-hover:scale-105 transition-transform duration-[10s]" />
            </section>

            {/* SEARCH */}
            <div className="relative max-w-2xl mx-auto group">
              <input 
                type="text" 
                placeholder="Busca marca, modelo o año..." 
                className="w-full bg-slate-900 border-2 border-slate-800 p-6 rounded-[2rem] text-white focus:border-blue-600 outline-none transition-all pl-16 text-lg font-medium shadow-2xl group-focus-within:bg-slate-900/80"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 w-6 h-6 group-focus-within:text-blue-500" />
            </div>

            {/* CAR GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredCars.map(car => (
                <div key={car.id} className="group bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all flex flex-col shadow-2xl hover:shadow-blue-500/10 active:scale-[0.98]">
                  <div className="relative h-80 overflow-hidden">
                    <img 
                      src={car.imageUrls[0]} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                      alt={car.model} 
                    />
                    <div className="absolute top-6 left-6">
                       <div className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-[12px] font-black italic shadow-2xl border border-white/10">
                         ${car.enganche.toLocaleString()} DP
                       </div>
                    </div>
                  </div>
                  <div className="p-10 space-y-8 flex-1 flex flex-col">
                    <div className="space-y-2">
                      <h3 className="text-3xl font-black uppercase text-white leading-none tracking-tight group-hover:text-blue-400 transition-colors">{car.make} {car.model}</h3>
                      <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-blue-500" /> {car.location} • {car.year}
                      </p>
                    </div>
                    <button 
                      onClick={() => { setSelectedCar(car); setActiveImageIndex(0); setCurrentView('details'); window.scrollTo(0,0); }} 
                      className="mt-auto w-full bg-slate-800 hover:bg-blue-600 text-white py-6 rounded-3xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center justify-center gap-3 border border-slate-700 hover:border-blue-500 shadow-lg"
                    >
                      Ver Unidad <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'details' && selectedCar && (
          <div className="space-y-12 fade-in">
            <button 
              onClick={() => { setCurrentView('grid'); setSelectedCar(null); }} 
              className="flex items-center gap-3 text-slate-600 hover:text-white transition-colors text-[11px] font-black uppercase tracking-[0.4em] group"
            >
              <ChevronLeft className="w-5 h-5 group-hover:-translate-x-2 transition-transform" /> Catálogo
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-7 space-y-8">
                <div className="relative rounded-[3.5rem] overflow-hidden bg-slate-900 border border-slate-800 aspect-[16/10] shadow-3xl group/gallery">
                  <img src={selectedCar.imageUrls[activeImageIndex]} className="w-full h-full object-cover transition-all duration-700" alt="Vehículo" />
                  <div className="absolute top-10 left-10">
                    <span className="bg-blue-600/90 backdrop-blur-xl text-white px-8 py-3 rounded-2xl text-[12px] font-black uppercase italic shadow-2xl border border-white/20">
                      Approved Certified
                    </span>
                  </div>
                  {selectedCar.imageUrls.length > 1 && (
                    <>
                      <button onClick={() => setActiveImageIndex(p => (p - 1 + selectedCar.imageUrls.length) % selectedCar.imageUrls.length)} className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-blue-600 p-5 rounded-full text-white backdrop-blur-2xl transition-all opacity-0 group-hover/gallery:opacity-100">
                        <ChevronLeft className="w-8 h-8" />
                      </button>
                      <button onClick={() => setActiveImageIndex(p => (p + 1) % selectedCar.imageUrls.length)} className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-blue-600 p-5 rounded-full text-white backdrop-blur-2xl transition-all opacity-0 group-hover/gallery:opacity-100">
                        <ChevronRight className="w-8 h-8" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
                  {selectedCar.imageUrls.map((url, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`relative w-40 h-24 rounded-[1.5rem] overflow-hidden flex-shrink-0 border-4 transition-all ${idx === activeImageIndex ? 'border-blue-600 scale-105 shadow-xl shadow-blue-600/20' : 'border-slate-950 opacity-40 hover:opacity-100'}`}>
                      <img src={url} className="w-full h-full object-cover" alt="Mini" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-10">
                <div className="space-y-4">
                  <h1 className="text-6xl md:text-8xl font-black uppercase text-white leading-[0.85] tracking-tighter italic">
                    {selectedCar.make} <br/> {selectedCar.model}
                  </h1>
                  <div className="flex items-center gap-4 text-slate-500 text-2xl font-bold uppercase italic">
                    <span>{selectedCar.year}</span>
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <span>{selectedCar.location} Hub</span>
                  </div>
                </div>

                <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-slate-800 italic text-slate-300 text-xl leading-relaxed shadow-inner">
                  "{selectedCar.description}"
                </div>

                <div className="bg-white p-12 rounded-[4rem] shadow-4xl space-y-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Enganche Requerido</p>
                      <p className="text-7xl font-black text-slate-950 tracking-tighter italic leading-none">${selectedCar.enganche.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-600/10 p-5 rounded-3xl">
                      <DollarSign className="w-10 h-10 text-blue-600" />
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsFunnelOpen(true)} 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-8 rounded-[2rem] font-black uppercase text-lg tracking-[0.2em] shadow-2xl shadow-blue-600/40 flex items-center justify-center gap-5 transition-all active:scale-95 group"
                  >
                    <MessageCircle className="w-8 h-8 group-hover:rotate-12 transition-transform" /> 
                    AGENDAR CITA HOY
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-950 border-t border-slate-900 py-40 text-center opacity-40">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Texas Cars <span className="text-blue-500">Approved</span></h2>
        <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.8em] mt-6">Production v9.0 • Deployment Ready</p>
      </footer>

      {/* MODALS (IDEM ANTERIOR PERO OPTIMIZADOS) */}
      {isFunnelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/98 backdrop-blur-3xl fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[5rem] w-full max-w-2xl p-16 md:p-24 space-y-20 relative shadow-4xl">
            <button onClick={() => setIsFunnelOpen(false)} className="absolute top-12 right-12 text-slate-600 hover:text-white transition-colors">
              <X className="w-10 h-10" />
            </button>
            <div className="text-center space-y-12">
              <div className="bg-blue-600/10 w-32 h-32 rounded-full flex items-center justify-center mx-auto border border-blue-500/20 shadow-2xl">
                <CheckCircle2 className="w-16 h-16 text-blue-500" />
              </div>
              <div className="space-y-6">
                <h2 className="text-5xl font-black uppercase italic tracking-tighter text-white">Confirmar Cita</h2>
                <p className="text-slate-400 text-2xl font-medium leading-relaxed">¿Deseas validar tu asistencia hoy?</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <button onClick={() => handleReturnToWhatsApp('Houston')} className="p-10 bg-slate-800 hover:bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">SEDE HOUSTON</button>
                 <button onClick={() => handleReturnToWhatsApp('Dallas')} className="p-10 bg-slate-800 hover:bg-blue-600 text-white rounded-[2.5rem] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">SEDE DALLAS</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/98 backdrop-blur-xl overflow-y-auto fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-[4rem] w-full max-w-5xl my-10 p-16 space-y-16 shadow-4xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-12 right-12 text-slate-600 hover:text-white"><X className="w-8 h-8" /></button>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Editor de <span className="text-blue-500">Inventario</span></h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <input type="text" placeholder="Marca" className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl text-white outline-none focus:border-blue-500 font-bold" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                  <input type="text" placeholder="Modelo" className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl text-white outline-none focus:border-blue-500 font-bold" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <input type="number" placeholder="Año" className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl text-white outline-none focus:border-blue-500 font-bold" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value)})} />
                  <select className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl text-white outline-none focus:border-blue-500 font-bold" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value as any})}>
                    <option value="Houston">Houston</option>
                    <option value="Dallas">Dallas</option>
                  </select>
                </div>
                <input type="number" placeholder="Enganche ($)" className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-2xl text-blue-500 font-black text-2xl outline-none focus:border-blue-500" value={formData.enganche} onChange={e => setFormData({...formData, enganche: parseInt(e.target.value)})} />
                <textarea placeholder="Descripción persuasiva..." rows={5} className="w-full bg-slate-800 border-2 border-slate-700 p-6 rounded-[2rem] text-white outline-none focus:border-blue-500 italic font-medium" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-8">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Multimedia (Carrusel)</label>
                <div className="grid grid-cols-3 gap-6">
                  {(formData.imageUrls || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-[1.5rem] overflow-hidden group/img border-2 border-slate-800 shadow-xl">
                      <img src={url} className="w-full h-full object-cover" />
                      <button onClick={() => setFormData(f => ({ ...f, imageUrls: f.imageUrls?.filter((_, i) => i !== idx) }))} className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all text-white backdrop-blur-sm"><Trash2 className="w-10 h-10" /></button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 active:scale-95 transition-all group">
                    <Plus className="w-10 h-10 text-blue-500 group-hover:scale-125 transition-transform" />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Subir</span>
                  </button>
                  <button onClick={handleAIGenerateImage} disabled={isGeneratingImg} className="aspect-square bg-slate-950 border-2 border-slate-800 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 disabled:opacity-50 active:scale-95 group shadow-inner">
                    {isGeneratingImg ? <Loader2 className="animate-spin w-10 h-10 text-indigo-500" /> : <Sparkles className="w-10 h-10 text-indigo-500 group-hover:rotate-12 transition-transform" />}
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">IA</span>
                  </button>
                </div>
              </div>
            </div>
            <button onClick={handleSaveCar} className="w-full py-10 bg-blue-600 hover:bg-blue-500 text-white rounded-[2.5rem] font-black uppercase text-xl tracking-[0.4em] shadow-3xl shadow-blue-600/20 active:scale-[0.98] transition-all">
              Guardar en Catálogo
            </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const filesList = e.target.files;
            if (filesList) {
              Array.from(filesList).forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => setFormData(f => ({ ...f, imageUrls: [...(f.imageUrls || []), reader.result as string] }));
                reader.readAsDataURL(file);
              });
            }
          }} />
        </div>
      )}
    </div>
  );
};

export default App;
