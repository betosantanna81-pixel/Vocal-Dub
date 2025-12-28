
import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ChameleonLogo, 
  APP_VERSION, 
  VOICE_OPTIONS, 
  MOOD_OPTIONS
} from './constants';
import { VoiceMood, SpeechParams, VoiceProfile } from './types';
import { generateSpeech } from './services/geminiService';

// Configuração do worker do PDF.js via ESM
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs`;

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICE_OPTIONS[0].id);
  const [selectedMood, setSelectedMood] = useState<VoiceMood>(VoiceMood.NEUTRAL);
  const [params, setParams] = useState<SpeechParams>({
    speed: 10,
    pitch: 10,
    resonance: 10,
    aspiration: 10,
    nasality: 10,
    prosody: 10,
    age: 10,
    texture: 10,
    intensity: 10
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [savedProfiles, setSavedProfiles] = useState<VoiceProfile[]>([]);
  const [profileName, setProfileName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('voice_dub_profiles');
    if (saved) {
      try {
        setSavedProfiles(JSON.parse(saved));
      } catch (e) { console.error(e); }
    }
  }, []);

  const handleGenerate = async (textToRead: string = text) => {
    if (!textToRead.trim()) {
      setError("Insira um texto ou carregue um arquivo para ler.");
      return;
    }
    
    if (textToRead === text) setIsLoading(true);
    else setIsTesting(true);

    setError(null);
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audioUrl = await generateSpeech(textToRead, selectedVoice, selectedMood, params);
      setCurrentAudioUrl(audioUrl);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => setIsPlaying(false);
      audio.play();
    } catch (err: any) {
      setError(err.message || "Erro ao gerar síntese de voz.");
    } finally {
      setIsLoading(false);
      setIsTesting(false);
    }
  };

  const handleVoiceTest = () => {
    handleGenerate("essa é minha nova voz, o que acha dela?");
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsFileLoading(true);
    setError(null);

    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
        }
        setText(fullText.trim());
      } else {
        const reader = new FileReader();
        reader.onload = (event) => setText(event.target?.result as string);
        reader.readAsText(file);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao carregar arquivo.");
    } finally {
      setIsFileLoading(false);
      e.target.value = "";
    }
  };

  const saveToLibrary = () => {
    if (!profileName.trim()) return;
    const newProfile: VoiceProfile = { 
      id: Date.now().toString(), 
      name: profileName, 
      baseVoiceId: selectedVoice, 
      mood: selectedMood, 
      params: { ...params } 
    };
    const updated = [...savedProfiles, newProfile];
    setSavedProfiles(updated);
    localStorage.setItem('voice_dub_profiles', JSON.stringify(updated));
    setProfileName('');
    setShowSaveModal(false);
  };

  const renderSlider = (label: string, key: keyof SpeechParams, labels: [string, string]) => (
    <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 group/slider transition-all hover:bg-white hover:border-indigo-100">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</label>
        <span className="text-sm font-mono text-indigo-600 font-black bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">{params[key]}</span>
      </div>
      <div className="relative flex items-center group">
        <input 
          type="range" min="0" max="20" step="1"
          value={params[key]}
          onChange={(e) => setParams(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
        />
      </div>
      <div className="flex justify-between text-[9px] text-slate-300 font-bold uppercase tracking-widest group-hover/slider:text-slate-400 transition-colors">
        <span>{labels[0]}</span>
        <span>{labels[1]}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFEFE] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Navbar Superior */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-5">
            <ChameleonLogo />
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Voice Dub</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded-md font-black tracking-tighter uppercase">Pro</span>
                <span className="text-[10px] text-slate-400 font-bold font-mono">Build v{APP_VERSION}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowSaveModal(true)} 
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95"
            >
              SALVAR PERFIL
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-screen-2xl mx-auto w-full p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* COLUNA 1: REDATOR */}
        <div className="lg:col-span-4 h-full">
          <section className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100 relative group h-full flex flex-col min-h-[600px]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center space-x-3">
                <i className="fas fa-align-left text-indigo-500"></i>
                <span>Redator de Dublagem</span>
              </h2>
              <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center shadow-lg shadow-slate-100">
                {isFileLoading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt mr-2"></i>}
                <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} className="hidden" />
                <span className="ml-2">CARREGAR</span>
              </label>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Digite o roteiro aqui..."
              className="flex-1 w-full p-0 bg-transparent focus:outline-none text-slate-800 text-xl font-medium leading-relaxed resize-none scrollbar-hide"
            />
            <div className="mt-6 flex justify-between items-center border-t border-slate-50 pt-6">
              <button onClick={() => setText('')} className="text-[10px] font-bold text-slate-300 hover:text-red-400 transition-colors uppercase tracking-widest">Limpar</button>
              <div className="text-[11px] font-black font-mono text-slate-200">{text.length} CHARS</div>
            </div>
          </section>
        </div>

        {/* COLUNA 2: SÍNTESE E BIBLIOTECA */}
        <div className="lg:col-span-8 space-y-10">
          
          <section className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center space-x-3">
                <i className="fas fa-microscope text-teal-500"></i>
                <span>Matriz de Síntese Vocal</span>
              </h3>
              <button 
                onClick={handleVoiceTest}
                disabled={isTesting || isLoading}
                className="bg-indigo-50 text-indigo-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center"
              >
                {isTesting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-vial mr-2"></i>}
                Ouvir Timbre
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-10 mb-12">
              {/* Grupo 1: Arquitetura Física */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center space-x-2">
                  <span className="w-4 h-px bg-slate-200"></span>
                  <span>Arquitetura Física</span>
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">Voz Base</label>
                    <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 text-sm appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
                      {VOICE_OPTIONS.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-300 uppercase">Estilo</label>
                    <select value={selectedMood} onChange={(e) => setSelectedMood(e.target.value as VoiceMood)} className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 text-sm appearance-none cursor-pointer hover:bg-slate-100 transition-colors">
                      {MOOD_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
                {renderSlider('Tom (Pitch)', 'pitch', ['Grave', 'Agudo'])}
                {renderSlider('Brilho (Timbre)', 'resonance', ['Opaco', 'Brilhante'])}
                {renderSlider('Idade Vocal', 'age', ['Infantil', 'Idoso'])}
                {renderSlider('Nasalidade', 'nasality', ['Oral', 'Anasalada'])}
              </div>

              {/* Grupo 2: Dinâmica e Expressividade */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center space-x-2">
                  <span className="w-4 h-px bg-slate-200"></span>
                  <span>Dinâmica & Expressividade</span>
                </h4>
                {renderSlider('Velocidade', 'speed', ['Lenta', 'Rápida'])}
                {renderSlider('Intensidade', 'intensity', ['Íntima', 'Vibrante'])}
                {renderSlider('Textura Vocal', 'texture', ['Áspera', 'Sedosa'])}
                {renderSlider('Aspiridade (Ar)', 'aspiration', ['Firme', 'Soprada'])}
                {renderSlider('Prosódia', 'prosody', ['Monótona', 'Expressiva'])}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={() => handleGenerate()} 
                disabled={isLoading || isTesting} 
                className={`flex-[3] py-6 rounded-[1.5rem] font-black text-white shadow-2xl transition-all flex items-center justify-center space-x-4 text-xl tracking-tight ${
                  isLoading 
                    ? 'bg-slate-200 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.98]'
                }`}
              >
                {isLoading ? (
                  <><i className="fas fa-spinner fa-spin"></i><span>Sintetizando...</span></>
                ) : (
                  <><i className="fas fa-waveform"></i><span>DUBAR AGORA</span></>
                )}
              </button>
              
              {currentAudioUrl && (
                <button 
                  onClick={togglePlayback} 
                  className="flex-1 py-6 bg-white border-2 border-slate-100 text-slate-900 rounded-[1.5rem] font-black hover:bg-slate-50 flex items-center justify-center space-x-4 transition-all"
                >
                  <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-indigo-600`}></i>
                  <span>{isPlaying ? 'STOP' : 'PLAY'}</span>
                </button>
              )}
            </div>
            
            {error && (
              <div className="mt-8 p-5 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-[11px] font-black flex items-center space-x-3 uppercase tracking-wider">
                <i className="fas fa-exclamation-triangle"></i>
                <span>Erro de Processamento: {error}</span>
              </div>
            )}
          </section>

          {/* Biblioteca */}
          <section className="bg-white rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.02)] border border-slate-100">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center space-x-3 border-b border-slate-50 pb-6">
              <i className="fas fa-layer-group text-indigo-400"></i>
              <span>Biblioteca de Identidades Vocais</span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedProfiles.length === 0 ? (
                <div className="col-span-full py-10 text-center text-slate-200 uppercase font-black tracking-widest text-[10px]">Biblioteca Vazia</div>
              ) : (
                savedProfiles.map(p => (
                  <div key={p.id} onClick={() => { setSelectedVoice(p.baseVoiceId); setSelectedMood(p.mood); setParams(p.params); }} className="p-5 border border-slate-100 rounded-2xl cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/20 transition-all flex items-center space-x-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 font-bold"><i className="fas fa-fingerprint"></i></div>
                    <div className="truncate"><h4 className="font-black text-slate-800 text-xs truncate">{p.name}</h4><span className="text-[8px] text-slate-300 font-bold uppercase">{p.baseVoiceId}</span></div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </main>

      {/* Modal Salvamento */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-6">
          <div className="bg-white rounded-[3rem] p-12 w-full max-w-md shadow-2xl border border-slate-100">
            <h3 className="text-2xl font-black text-slate-900 mb-2 text-center">Registrar Timbre</h3>
            <p className="text-xs text-slate-400 mb-10 font-bold text-center uppercase tracking-widest">Identifique esta configuração neural</p>
            <input autoFocus value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Nome da Identidade..." className="w-full p-5 bg-slate-50 border-2 border-slate-50 rounded-2xl mb-8 outline-none focus:border-indigo-500 font-bold transition-all text-center" onKeyDown={(e) => e.key === 'Enter' && saveToLibrary()} />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowSaveModal(false)} className="py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] uppercase">Cancelar</button>
              <button onClick={saveToLibrary} disabled={!profileName.trim()} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase hover:bg-indigo-700">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #F1F5F9; border-radius: 10px; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; height: 18px; width: 18px; border-radius: 50%; background: #4F46E5;
          cursor: pointer; border: 3px solid #FFFFFF; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
