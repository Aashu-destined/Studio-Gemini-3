
import React, { useState, useRef } from 'react';
import { 
  GenerationModel, 
  GenerationConfig, 
  GeneratedImage, 
  AspectRatio, 
  ImageSize,
  ReferenceImage
} from './types.ts';
import { generateImages } from './services/geminiService.ts';

const STYLE_PRESETS = [
  {
    name: "Cyberpunk",
    style: "Neon, Rainy, High-Tech",
    prompt: "A neon-lit cyberpunk metropolis in a heavy downpour, vibrant signs, chrome reflections, cinematic 8k.",
    preview: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?w=400&q=80"
  },
  {
    name: "Liquid Glass",
    style: "Refractive, Crystal, Clean",
    prompt: "Abstract sculpture made of liquid glass flowing through a snowy mountain range, intricate refraction, 8k photorealistic.",
    preview: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80"
  },
  {
    name: "Ethereal Dream",
    style: "Soft, Magical, Pastel",
    prompt: "Floating cloud kingdom at sunset, bioluminescent petals falling, dreamlike atmosphere, soft lighting, fantasy art.",
    preview: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&q=80"
  },
  {
    name: "Noir Cinema",
    style: "Moody, Sharp, Monochrome",
    prompt: "Film noir detective standing in a misty alleyway, dramatic high-contrast lighting, black and white, 35mm film style.",
    preview: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80"
  }
];

export default function App() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [activeContext, setActiveContext] = useState<GeneratedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<GenerationConfig>({
    model: GenerationModel.PRO_IMAGE,
    prompt: '',
    aspectRatio: '1:1',
    imageSize: '1K',
    numberOfImages: 1,
    outputFormat: 'image/png',
    googleSearch: false,
    referenceImages: [],
    safetySettings: {
      harassment: false,
      hateSpeech: false,
      sexuallyExplicit: false,
      dangerousContent: false,
    },
  });

  const handleOpenKeySelector = async () => {
    try {
      // @ts-ignore
      if (window.aistudio?.openSelectKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
      }
    } catch (err) {
      console.error("Failed to open key selector", err);
    }
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 14 - config.referenceImages.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    const newRefs: ReferenceImage[] = await Promise.all(
      filesToProcess.map(file => new Promise<ReferenceImage>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          resolve({
            id: Math.random().toString(36).substring(2, 9),
            base64: base64String,
            mimeType: file.type,
            previewUrl: URL.createObjectURL(file)
          });
        };
        reader.readAsDataURL(file);
      }))
    );

    setConfig(prev => ({
      ...prev,
      referenceImages: [...prev.referenceImages, ...newRefs]
    }));
  };

  const removeReference = (id: string) => {
    setConfig(prev => ({
      ...prev,
      referenceImages: prev.referenceImages.filter(r => r.id !== id)
    }));
  };

  const applyPreset = (prompt: string) => {
    setConfig({ ...config, prompt });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerate = async (variationTarget?: GeneratedImage) => {
    const isVariation = !!variationTarget;
    const promptToUse = isVariation 
      ? `Create a slight artistic variation of this image, maintaining the core theme and style but with different details.` 
      : config.prompt;

    if (!isVariation && !promptToUse.trim()) {
      setError("Enter a prompt to create your artwork.");
      return;
    }

    if (config.model === GenerationModel.PRO_IMAGE) {
      // @ts-ignore
      const hasKey = await window.aistudio?.hasSelectedApiKey();
      if (!hasKey) {
        await handleOpenKeySelector();
      }
    }

    setIsGenerating(true);
    setError(null);

    try {
      const target = variationTarget || activeContext;
      const context = target && target.base64Data ? {
        base64: target.base64Data,
        mimeType: target.mimeType || 'image/png'
      } : undefined;

      const newImages = await generateImages({
        ...config,
        prompt: promptToUse
      }, context);
      
      setGallery(prev => [...newImages, ...prev]);
      
      if (newImages.length > 0) {
        setActiveContext(newImages[0]); 
      }
    } catch (err: any) {
      if (err?.message === "BYOK_REQUIRED") {
        setError("Please select a valid API key from a paid GCP project to use the Pro model.");
        await handleOpenKeySelector();
      } else {
        setError(err.message || "An error occurred while generating images.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="py-8 px-4 md:px-8 flex items-center justify-between max-w-7xl mx-auto w-full relative z-10">
        <div className="flex items-center gap-4 group cursor-pointer transition-all duration-300 hover:scale-105">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 group-hover:rotate-6 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter leading-none uppercase">Studio <span className="gradient-text">Gemini 3</span></h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.4em] uppercase mt-1">High-Fidelity Neural Synthesis</p>
          </div>
        </div>
        <div className="flex gap-6 items-center">
          <button 
            onClick={handleOpenKeySelector}
            className="text-[10px] font-black tracking-widest text-indigo-400 hover:text-white transition-all bg-indigo-500/10 px-5 py-2.5 rounded-full border border-indigo-500/20 hover:bg-indigo-600 hover:border-indigo-400"
          >
            MANAGE API KEY
          </button>
          <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>
          <div className="hidden md:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10 text-[10px] font-bold tracking-widest text-green-400 hover:bg-white/10 transition-colors cursor-default">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            ACTIVE PRO ENGINE
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 space-y-12 relative z-10">
        
        {/* Main Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Creative Input Block */}
          <section className="lg:col-span-7 liquid-glass rounded-[2.5rem] p-8 flex flex-col gap-6 hover:shadow-indigo-500/20 transition-all border-white/20 group">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
                <span className="p-2.5 bg-indigo-500/20 rounded-xl group-hover:scale-110 transition-transform text-indigo-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </span>
                CREATION ENGINE
              </h2>
              {config.model === GenerationModel.PRO_IMAGE && (
                <div className="flex items-center gap-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer hover:text-indigo-400 transition-colors">
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={config.googleSearch}
                      onChange={(e) => setConfig({...config, googleSearch: e.target.checked})}
                    />
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full transition-all">
                      <span className={`w-2 h-2 rounded-full ${config.googleSearch ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]' : 'bg-slate-700'}`}></span>
                      GOOGLE SEARCH GROUNDING
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="relative flex-1 flex flex-col gap-4">
              {activeContext && (
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-indigo-500/30 animate-in fade-in slide-in-from-top-2">
                  <img src={activeContext.url} className="w-12 h-12 rounded-lg object-cover border border-white/20" alt="context" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Multi-Turn Editing</p>
                    <p className="text-[10px] text-slate-400 truncate italic">Refining current masterpiece...</p>
                  </div>
                  <button onClick={() => setActiveContext(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              <textarea 
                placeholder={activeContext ? "Explain the changes: 'Change the sky to purple', 'Add a robotic cat'..." : "Describe your vision in high-fidelity detail... Tip: Use [Google Search] for trending concepts."}
                value={config.prompt}
                onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                className="w-full flex-1 bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all min-h-[180px] resize-none custom-scrollbar placeholder:text-slate-600 font-medium"
              />

              {/* Reference Images List */}
              {config.referenceImages.length > 0 && (
                <div className="flex flex-wrap gap-3 p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
                  {config.referenceImages.map(ref => (
                    <div key={ref.id} className="relative group/ref w-16 h-16">
                      <img src={ref.previewUrl} className="w-full h-full object-cover rounded-xl border border-white/20" alt="ref" />
                      <button 
                        onClick={() => removeReference(ref.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover/ref:opacity-100 transition-all scale-75"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  {config.referenceImages.length < 14 && (
                     <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 flex items-center justify-center bg-white/5 border-2 border-dashed border-white/20 rounded-xl hover:bg-white/10 hover:border-indigo-500/40 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </button>
                  )}
                  <p className="w-full text-[8px] font-black text-slate-600 uppercase tracking-widest mt-2">{config.referenceImages.length}/14 References Loaded</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-4">
              {config.referenceImages.length === 0 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-5 rounded-3xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all flex items-center gap-3 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Add References</span>
                </button>
              )}
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleReferenceUpload} 
              />
              <button 
                onClick={() => handleGenerate()}
                disabled={isGenerating}
                className={`flex-1 py-5 rounded-3xl font-black text-[12px] tracking-[0.2em] uppercase flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 hover:scale-[1.01] ${isGenerating ? 'bg-indigo-900/50 cursor-not-allowed opacity-50' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/40 text-white'}`}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>THINKING...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.047a1 1 0 01.897.95l1.446 13.737a1 1 0 01-.61 1.056l-3.5 1.5a1 1 0 01-1.066-.12l-2.004-1.503a1 1 0 01-.39-.78l-.694-11.838a1 1 0 01.831-1.05l5.5-.951zM10 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" clipRule="evenodd" /></svg>
                    <span>{activeContext ? 'REWRITE REALITY' : 'SYNTHESIZE ART'}</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Configuration Parameters Block */}
          <section className="lg:col-span-5 liquid-glass rounded-[2.5rem] p-8 flex flex-col gap-8 hover:shadow-purple-500/20 transition-all border-white/20 group">
            <h2 className="text-xl font-black flex items-center gap-3 tracking-tight">
              <span className="p-2.5 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform text-purple-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </span>
              CORE CONFIG
            </h2>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">AI Synthesis Engine</label>
                <select 
                  value={config.model} 
                  onChange={(e) => setConfig({ ...config, model: e.target.value as GenerationModel })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold focus:ring-4 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer hover:bg-white/10"
                >
                  <option value={GenerationModel.PRO_IMAGE} className="bg-slate-900">GEMINI 3 PRO IMAGE (ULTRA)</option>
                  <option value={GenerationModel.FLASH_IMAGE} className="bg-slate-900">GEMINI 2.5 FLASH</option>
                  <option value={GenerationModel.IMAGEN_4} className="bg-slate-900">IMAGEN 4.0</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Symmetry (Aspect Ratio)</label>
                <div className="grid grid-cols-5 gap-2">
                  {(['1:1', '4:3', '3:4', '16:9', '9:16'] as AspectRatio[]).map(ratio => (
                    <button 
                      key={ratio}
                      onClick={() => setConfig({ ...config, aspectRatio: ratio })}
                      className={`py-3 rounded-xl text-[10px] font-bold transition-all border ${config.aspectRatio === ratio ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/40' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Neural Precision (Resolution)</label>
                <div className="flex gap-2">
                  {(['1K', '2K', '4K'] as ImageSize[]).map(size => (
                    <button 
                      key={size}
                      disabled={config.model !== GenerationModel.PRO_IMAGE}
                      onClick={() => setConfig({ ...config, imageSize: size })}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all border disabled:opacity-20 disabled:cursor-not-allowed ${config.imageSize === size ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/40' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Entity Parallelism</label>
                  <span className="text-[10px] font-black text-indigo-400">{config.numberOfImages} VARIANTS</span>
                </div>
                <input 
                  type="range" min="1" max="4" 
                  value={config.numberOfImages} 
                  onChange={(e) => setConfig({...config, numberOfImages: parseInt(e.target.value)})} 
                  className="w-full accent-indigo-500 bg-white/10 h-1.5 rounded-full cursor-pointer hover:accent-indigo-400 transition-all" 
                />
              </div>
            </div>
          </section>
        </div>

        {/* Style Selection */}
        <section className="space-y-8">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black tracking-tight shrink-0 uppercase">Style <span className="gradient-text">Matrix</span></h2>
            <div className="h-[1px] flex-1 bg-white/10"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STYLE_PRESETS.map((preset) => (
              <button 
                key={preset.name}
                onClick={() => applyPreset(preset.prompt)}
                className="group relative h-56 rounded-[2rem] overflow-hidden border border-white/10 transition-all hover:scale-[1.04] hover:shadow-2xl hover:border-indigo-500/50"
              >
                <img src={preset.preview} alt={preset.name} className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:rotate-1" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6 text-left">
                  <h3 className="font-black text-sm tracking-tight mb-1 group-hover:text-indigo-400 transition-colors uppercase">{preset.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider group-hover:text-slate-200 transition-colors">{preset.style}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Dynamic Art Gallery */}
        <section className="space-y-10 pb-20">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tighter uppercase">Visual <span className="gradient-text">History</span></h2>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-slate-500 bg-white/5 px-4 py-2 rounded-full border border-white/10">{gallery.length} OBJECTS</span>
              <button 
                onClick={() => setGallery([])} 
                className="text-[10px] font-black text-slate-500 hover:text-red-400 transition-colors px-4 py-2 hover:bg-red-500/10 rounded-full uppercase"
              >
                Purge Matrix
              </button>
            </div>
          </div>

          {gallery.length === 0 ? (
            <div className="h-[500px] rounded-[4rem] liquid-glass border-dashed border-2 flex flex-col items-center justify-center gap-8 opacity-40 hover:opacity-60">
              <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center animate-pulse border border-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-black tracking-[0.2em] uppercase">VOID DETECTED</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Awaiting creative synthesis</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
              {gallery.map((img) => (
                <div 
                  key={img.id} 
                  className="group relative rounded-[2.5rem] overflow-hidden glass aspect-square cursor-pointer hover:scale-[1.05] hover:shadow-2xl transition-all duration-500 border border-white/5 hover:border-indigo-500/40"
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img.url} alt={img.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest">
                        {img.model.includes('pro') ? 'PRO 3.0' : img.model.includes('flash') ? 'FLASH 2.5' : 'IMAGEN 4'}
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerate(img);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          disabled={isGenerating}
                          className="bg-white/10 hover:bg-purple-600 text-white p-2 rounded-xl transition-all hover:scale-110 disabled:opacity-50"
                          title="Generate Variation"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveContext(img);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="bg-white/10 hover:bg-indigo-500 text-white p-2 rounded-xl transition-all hover:scale-110"
                          title="Conversational Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-white/90 line-clamp-2 mb-6 italic font-medium leading-relaxed">"{img.prompt}"</p>
                    <div className="flex gap-3">
                      <a 
                        href={img.url} 
                        download={`gemini-art-${img.id}.png`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-white hover:bg-indigo-600 text-black hover:text-white rounded-2xl py-3.5 text-[10px] font-black tracking-widest text-center transition-all uppercase hover:scale-105 active:scale-95 shadow-xl"
                      >
                        DOWNLOAD
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Symmetric Full Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-16 bg-black/98 backdrop-blur-3xl animate-in fade-in duration-500" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-7xl w-full flex flex-col gap-8 animate-float" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-16 right-0 flex gap-4">
              <button 
                onClick={() => setSelectedImage(null)} 
                className="w-14 h-14 glass rounded-full flex items-center justify-center hover:bg-white/10 hover:rotate-90 transition-all text-white border-white/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="liquid-glass rounded-[4rem] overflow-hidden p-4 shadow-2xl border-white/20 relative group/modal">
              <img src={selectedImage.url} alt={selectedImage.prompt} className="w-full h-auto max-h-[70vh] object-contain rounded-[3.5rem] shadow-2xl" />
              <div className="absolute bottom-10 left-10 right-10 flex gap-6 items-end translate-y-4 opacity-0 group-hover/modal:translate-y-0 group-hover/modal:opacity-100 transition-all duration-500">
                <div className="flex-1 liquid-glass rounded-[2rem] p-8 shadow-2xl">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Masterpiece Data</p>
                  <p className="text-sm md:text-lg text-white font-medium italic leading-relaxed">"{selectedImage.prompt}"</p>
                </div>
                <div className="flex flex-col gap-4">
                   <button 
                    onClick={() => {
                      handleGenerate(selectedImage);
                      setSelectedImage(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={isGenerating}
                    className="px-10 py-5 bg-purple-600 text-white font-black tracking-widest rounded-3xl text-[10px] hover:bg-purple-500 hover:scale-105 transition-all shadow-2xl active:scale-95 uppercase disabled:opacity-50"
                  >
                    GENERATE VARIATION
                  </button>
                   <button 
                    onClick={() => {
                      setActiveContext(selectedImage);
                      setSelectedImage(null);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-10 py-5 bg-indigo-600 text-white font-black tracking-widest rounded-3xl text-[10px] hover:bg-indigo-500 hover:scale-105 transition-all shadow-2xl active:scale-95 uppercase"
                  >
                    CONTINUE EDITING
                  </button>
                  <a 
                    href={selectedImage.url} 
                    download 
                    className="px-10 py-5 bg-white text-black font-black tracking-widest rounded-3xl text-[10px] hover:bg-slate-200 hover:scale-105 transition-all shadow-2xl active:scale-95 text-center uppercase"
                  >
                    DOWNLOAD
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Symmetric Global Error State */}
      {error && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[120] bg-red-500/90 backdrop-blur-xl text-white px-8 py-5 rounded-[2rem] flex items-center gap-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 border-2 border-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <div className="flex-1">
            <p className="text-[10px] font-black tracking-widest uppercase mb-1">System Alert</p>
            <p className="text-sm font-bold">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      )}

      <footer className="py-16 px-4 text-center border-t border-white/5 max-w-7xl mx-auto w-full relative z-10">
        <p className="text-[10px] font-black text-slate-500 tracking-[0.6em] uppercase mb-4">Gemini Matrix Studio // 2025</p>
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest italic opacity-50">High-Resolution Neural Synthesis // Pro 3.0</p>
        <div className="mt-4">
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[8px] font-black text-slate-500 hover:text-indigo-400 uppercase tracking-widest transition-colors"
          >
            Billing Documentation
          </a>
        </div>
      </footer>
    </div>
  );
}
