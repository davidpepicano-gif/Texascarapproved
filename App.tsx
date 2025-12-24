
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
  // Persistence with error handling
  const [cars, setCars] = useState<Car[]>(() => {
    try {
      const saved = localStorage.getItem('texas_cars_approved_v7');
      return saved ? JSON.parse(saved) : INITIAL_CARS;
    } catch (e) {
      return INITIAL_CARS;
    }
  });
  
  const [ghlConfig, setGhlConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('texas_ghl_v7');
      return saved ? JSON.parse(saved) : { whatsappNumber: '12815555555' };
    } catch (e) {
      return { whatsappNumber: '12815555555' };
    }
  });

  // UI States
  const [currentView, setCurrentView] = useState<ViewType>('grid');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGhlModalOpen, setIsGhlModalOpen] = useState(false);
  const [isFunnelOpen, setIsFunnelOpen] = useState(false);
  const [isClientMode, setIsClientMode] = useState(true);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [funnelStep, setFunnelStep] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Car>>({
    make: '', model: '', year: 2024, price: 0, mileage: 0, 
    engine: '', transmission: 'Automática', fuelType: 'Gasolina', 
    type: 'Sedán', location: 'Houston', enganche: 1300, status: 'Disponible', description: '',
    imageUrls: []
  });

  useEffect(() => {
    localStorage.setItem('texas_cars_approved_v7', JSON.stringify(cars));
    localStorage.setItem('texas_ghl_v7', JSON.stringify(ghlConfig));
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
    if (!formData.make || !formData.model) return alert("Completa marca y modelo.");
    if (formData.id) {
      setCars(cars.map(c => c.id === formData.id ? { ...c, ...formData } as Car : c));
    } else {
      const newCar = { ...formData, id: Date.now().toString(), features: [], imageUrls: formData.imageUrls || [] } as Car;
      setCars([newCar, ...cars]);
    }
    setIsModalOpen(false);
  };

  const handleAIGenerateImage = async () => {
    if (!formData.make || !formData.model) return alert("Indica marca y modelo.");
    setIsGeneratingImg(true);
    try {
      const url = await generateCarImage(formData);
      setFormData(prev => ({ ...prev, imageUrls: [...(prev.imageUrls || []), url] }));
    } catch (e) { 
      alert("Error con Gemini. Intenta de nuevo."); 
    } finally { 
      setIsGeneratingImg(false); 
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-600/30">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-2xl border-b border-slate-800/50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => { setCurrentView('grid'); setSelectedCar(null); }}>
          <div className="bg-blue-600 p-2 rounded-2xl">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none text-white">Texas Cars <span className="text-blue-500">Approved</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsClientMode(!isClientMode)} 
            className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all ${isClientMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            {isClientMode ? "PÚBLICO" : "ADMIN"}
          </button>
          {!isClientMode && (
            <div className="flex gap-2">
              <button onClick={() => setIsGhlModalOpen(true)} className="p-2 bg-slate-800 rounded-xl text-blue-400 hover:bg-slate-700 transition-colors">
                <Zap className="w-5 h-5" />
              </button>
              <button onClick={() => { setFormData({ make: '', model: '', year: 2024, price: 0, mileage: 0, engine: '', transmission: 'Automática', fuelType: 'Gasolina', type: 'Sedán', location: 'Houston', enganche: 1300, status: 'Disponible', description: '', imageUrls: [] }); setIsModalOpen(true); }} className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 hover:bg-blue-500 transition-all text-white">
                <Plus className="w-4 h-4" /> AÑADIR
              </button>
            </div>
          )}
        </div>
      </header>

      <nav className="bg-slate-900/30 border-b border-slate-800/30 py-4">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-center gap-6">
          <div className={`flex items-center gap-2 ${currentView === 'grid' ? 'text-blue-500' : 'opacity-20'}`}>
            <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center text-[10px] text-slate-950 font-black">1</div>
            <span className="text-[10px] font-black uppercase tracking-widest">Explora</span>
          </div>
          <div className="w-8 h-px bg-slate-800"></div>
          <div className={`flex items-center gap-2 ${currentView === 'details' ? 'text-blue-500' : 'opacity-20'}`}>
            <div className="w-6 h-6 rounded-full bg-current flex items-center justify-center text-[10px] text-slate-950 font-black">2</div>
            <span className="text-[10px] font-black uppercase tracking-widest">Valida</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {currentView === 'grid' && (
          <div className="space-y-12">
            <section className="bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center border border-slate-800 shadow-2xl relative overflow-hidden">
               <div className="relative z-10 space-y-6">
                  <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-500 px-4 py-1.5 rounded-full border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                    <Star className="w-3 h-3 fill-blue-500" /> Selección Texas Approved
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-none">
                    Inventario <span className="text-blue-500">Certificado</span>
                  </h2>
                  <p className="text-slate-400 text-xl max-w-2xl mx-auto font-medium">Unidades listas para entrega con el enganche validado.</p>
               </div>
            </section>

            <div className="relative max-w-xl mx-auto">
              <input 
                type="text" 
                placeholder="Busca por marca o modelo..." 
                className="w-full bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white focus:border-blue-500 outline-none transition-all pl-14"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCars.map(car => (
                <div key={car.id} className="group bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-800 hover:border-blue-500/40 transition-all flex flex-col shadow-xl">
                  <div className="relative h-72 overflow-hidden">
                    <img 
                      src={car.imageUrls[0]} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={car.model} 
                    />
                    <div className="absolute top-5 left-5">
                       <div className="bg-blue-600 text-white px-5 py-2 rounded-2xl text-[11px] font-black italic shadow-2xl border border-white/10">
                         ${car.enganche.toLocaleString()} DP
                       </div>
                    </div>
                  </div>
                  <div className="p-8 space-y-6 flex-1 flex flex-col">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black uppercase text-white leading-none">{car.make} {car.model}</h3>
                      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{car.location} • {car.year}</p>
                    </div>
                    <button 
                      onClick={() => { setSelectedCar(car); setActiveImageIndex(0); setCurrentView('details'); window.scrollTo(0,0); }} 
                      className="mt-auto w-full bg-slate-800 hover:bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all flex items-center justify-center gap-3 border border-slate-700 hover:border-blue-500"
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
          <div className="space-y-12 animate-in fade-in duration-500">
            <button onClick={() => setCurrentView('grid')} className="flex items-center gap-2 text-slate-600 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
              <ChevronLeft className="w-5 h-5" /> Volver al catálogo
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-7 space-y-6">
                <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 border border-slate-800 aspect-[16/10] shadow-2xl">
                  <img src={selectedCar.imageUrls[activeImageIndex]} className="w-full h-full object-cover" alt="Vehículo" />
                  {selectedCar.imageUrls.length > 1 && (
                    <>
                      <button onClick={() => setActiveImageIndex(p => (p - 1 + selectedCar.imageUrls.length) % selectedCar.imageUrls.length)} className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full text-white backdrop-blur-xl">
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button onClick={() => setActiveImageIndex(p => (p + 1) % selectedCar.imageUrls.length)} className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/50 p-4 rounded-full text-white backdrop-blur-xl">
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {selectedCar.imageUrls.map((url, idx) => (
                    <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`relative w-32 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-4 transition-all ${idx === activeImageIndex ? 'border-blue-600 scale-105' : 'border-slate-900 opacity-40'}`}>
                      <img src={url} className="w-full h-full object-cover" alt="Miniatura" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-4">
                  <h1 className="text-6xl font-black uppercase text-white leading-none tracking-tighter italic">
                    {selectedCar.make} <br/> {selectedCar.model}
                  </h1>
                  <p className="text-slate-500 text-xl font-bold uppercase italic">{selectedCar.year} • {selectedCar.location}</p>
                </div>

                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 italic text-slate-300 text-lg leading-relaxed">
                  "{selectedCar.description}"
                </div>

                <div className="bg-white p-10 rounded-[3rem] shadow-2xl space-y-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enganche Requerido</p>
                    <p className="text-6xl font-black text-slate-950 tracking-tighter italic leading-none">${selectedCar.enganche.toLocaleString()}</p>
                  </div>
                  <button onClick={() => setIsFunnelOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-blue-600/20 flex items-center justify-center gap-4 transition-all active:scale-95">
                    <MessageCircle className="w-6 h-6" /> AGENDAR CITA AHORA
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {isFunnelOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="bg-slate-900 border border-slate-800 rounded-[3.5rem] w-full max-w-xl p-12 space-y-12 relative animate-in zoom-in-95">
            <button onClick={() => setIsFunnelOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white"><X className="w-8 h-8" /></button>
            <div className="text-center space-y-6">
              <div className="bg-blue-600/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto border border-blue-500/20">
                <CheckCircle2 className="w-12 h-12 text-blue-500" />
              </div>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Último Paso</h2>
              <p className="text-slate-400 text-xl font-medium">¿Confirmas que tienes el enganche listo?</p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => handleReturnToWhatsApp('Houston')} className="p-6 bg-slate-800 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all">Sede Houston</button>
                 <button onClick={() => handleReturnToWhatsApp('Dallas')} className="p-6 bg-slate-800 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all">Sede Dallas</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/98 backdrop-blur-xl overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-4xl p-12 space-y-10 relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white"><X className="w-6 h-6" /></button>
            <h2 className="text-3xl font-black uppercase text-white">Gestionar Unidad</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <input type="text" placeholder="Marca" className="w-full bg-slate-800 border border-slate-700 p-5 rounded-xl text-white outline-none focus:border-blue-500" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} />
                <input type="text" placeholder="Modelo" className="w-full bg-slate-800 border border-slate-700 p-5 rounded-xl text-white outline-none focus:border-blue-500" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} />
                <input type="number" placeholder="Enganche ($)" className="w-full bg-slate-800 border border-slate-700 p-5 rounded-xl text-blue-400 font-bold" value={formData.enganche} onChange={e => setFormData({...formData, enganche: parseInt(e.target.value)})} />
                <textarea placeholder="Descripción" rows={4} className="w-full bg-slate-800 border border-slate-700 p-5 rounded-xl text-white outline-none focus:border-blue-500" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-3">
                  {(formData.imageUrls || []).map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-800 group">
                      <img src={url} className="w-full h-full object-cover" />
                      <button onClick={() => setFormData(f => ({ ...f, imageUrls: f.imageUrls?.filter((_, i) => i !== idx) }))} className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-white"><Trash2 /></button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-800 hover:bg-slate-700 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center gap-2">
                    <Plus className="text-blue-500" /> <span className="text-[10px] font-black uppercase">Subir</span>
                  </button>
                  <button onClick={handleAIGenerateImage} disabled={isGeneratingImg} className="aspect-square bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2 disabled:opacity-50">
                    {isGeneratingImg ? <Loader2 className="animate-spin text-indigo-500" /> : <Sparkles className="text-indigo-500" />}
                    <span className="text-[10px] font-black uppercase">IA</span>
                  </button>
                </div>
              </div>
            </div>
            <button onClick={handleSaveCar} className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest">Publicar Unidad</button>
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

      {isGhlModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/98 backdrop-blur-3xl">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] w-full max-w-md p-10 space-y-8">
            <h2 className="text-2xl font-black uppercase text-white flex items-center gap-3"><Zap className="text-blue-500" /> Configuración</h2>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-3">Número de WhatsApp</label>
              <input type="text" placeholder="Ej: 12815555555" className="w-full bg-slate-800 border border-slate-700 p-5 rounded-xl text-white outline-none focus:border-blue-500 font-mono" value={ghlConfig.whatsappNumber} onChange={e => setGhlConfig({...ghlConfig, whatsappNumber: e.target.value})} />
            </div>
            <button onClick={() => setIsGhlModalOpen(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-xl font-black uppercase tracking-widest transition-all">Guardar</button>
          </div>
        </div>
      )}
      
      <footer className="bg-slate-950 border-t border-slate-900 py-32 text-center opacity-30">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Texas Cars <span className="text-blue-500">Approved</span></h2>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em] mt-4">Sistema v7.0 • Listo para Vercel</p>
      </footer>
    </div>
  );
};

export default App;
