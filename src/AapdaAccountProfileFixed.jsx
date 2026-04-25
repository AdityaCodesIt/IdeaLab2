import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient.js';

export default function AapdaAccountProfileFixed({ onHome, onAI, onSignOut, formData, authUser, updateFormData }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    function noise() {
      const idata = ctx.createImageData(canvas.width, canvas.height);
      const buffer32 = new Uint32Array(idata.data.buffer);
      for (let i = 0; i < buffer32.length; i++) {
        if (Math.random() < 0.12) buffer32[i] = Math.random() < 0.5 ? 0xffffffff : 0xff000000;
      }
      ctx.putImageData(idata, 0, 0);
      animationFrameId = requestAnimationFrame(noise);
    }
    noise();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleTitleHover = (e) => {
    const title = e.currentTarget;
    const original = title.getAttribute('data-original') || title.innerText;
    if (!title.getAttribute('data-original')) {
        title.setAttribute('data-original', original);
    }
    
    let count = 0;
    const glitchInterval = setInterval(() => {
      title.innerText = original.split('').map(c => Math.random() > 0.7 ? '§' : c).join('');
      if (++count > 5) {
        clearInterval(glitchInterval);
        title.innerText = original;
      }
    }, 40);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(formData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) setEditForm(formData);
  }, [formData, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    console.log('Starting save process with editForm:', editForm);
    try {
      const payload = { ...editForm, email: formData.email || authUser?.email };
      console.log('Payload for supabase:', payload);
      
      let data, error;
      if (!payload.email) {
        throw new Error("Cannot save profile: Email identifier is missing.");
      }

      // Use update instead of upsert since the profile must already exist
      const response = await Promise.race([
        supabase.from('users').update(payload).eq('email', payload.email).select(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database request timed out')), 8000))
      ]);
      
      data = response.data;
      error = response.error;
        
      console.log('Supabase response:', { data, error });
      
      if (error) {
         console.error('Supabase error:', error);
         alert('ERROR: ' + error.message);
      } else {
         console.log('Save successful, updating local state');
         updateFormData(editForm);
         setIsEditing(false);
      }
    } catch(err) {
       console.error('Catch error:', err);
       alert('SYSTEM ERROR: ' + err.message);
    }
    setIsSaving(false);
  };

  return (
    <div className="bg-[#0a0a0a] text-[#e2e2e2] font-body selection:bg-white selection:text-[#1a1c1c] overflow-x-hidden min-h-screen w-screen text-left absolute inset-0 z-0">
      <style>{`
        /* --- CRT EFFECT --- */
        .crt-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                        linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 3px, 3px 100%;
            opacity: 0.15;
        }

        .crt-barrel {
            position: fixed;
            inset: 0;
            pointer-events: none;
            z-index: 998;
            box-shadow: inset 0 0 100px rgba(0,0,0,0.5);
            background: radial-gradient(circle at center, transparent 70%, rgba(0,0,0,0.3) 100%);
        }

        /* --- SCANLINE --- */
        .scanline {
            width: 100%;
            height: 100px;
            z-index: 9999;
            background: linear-gradient(0deg, rgba(0, 0, 0, 0) 0%, rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0) 100%);
            opacity: 0.1;
            position: fixed;
            bottom: 100%;
            pointer-events: none;
            animation: scanline 8s linear infinite;
        }
        @keyframes scanline {
            0% { top: -100px; }
            100% { top: 100%; }
        }

        /* --- NOISE BACKGROUND --- */
        #noise-canvas {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -2;
            opacity: 0.08;
            pointer-events: none;
        }

        /* --- GLITCH HEADLINE --- */
        .glitch-text {
            position: relative;
            animation: glitch-skew 4s infinite linear alternate-reverse;
        }
        .glitch-text::before, .glitch-text::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.8;
        }
        .glitch-text::before {
            left: 2px;
            text-shadow: -2px 0 #ff00c1;
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim 5s infinite linear alternate-reverse;
        }
        .glitch-text::after {
            left: -2px;
            text-shadow: -2px 0 #00fff9, 2px 2px #ff00c1;
            animation: glitch-anim2 1s infinite linear alternate-reverse;
        }

        @keyframes glitch-anim {
            0% { clip: rect(10px, 9999px, 50px, 0); transform: skew(0.3deg); }
            5% { clip: rect(80px, 9999px, 90px, 0); transform: skew(0.1deg); }
            10% { clip: rect(30px, 9999px, 40px, 0); transform: skew(0.5deg); }
            15% { clip: rect(60px, 9999px, 70px, 0); transform: skew(0.2deg); }
            100% { clip: rect(20px, 9999px, 30px, 0); transform: skew(0.1deg); }
        }
        @keyframes glitch-anim2 {
            0% { clip: rect(60px, 9999px, 80px, 0); transform: skew(1deg); }
            100% { clip: rect(10px, 9999px, 30px, 0); transform: skew(0.5deg); }
        }
        @keyframes glitch-skew {
            0%, 90% { transform: skew(0deg); }
            95% { transform: skew(-5deg); }
            100% { transform: skew(5deg); }
        }

        /* --- GLASS MORPHISM --- */
        .glass-morphism {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            transition: all 0.2s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        /* --- DECRYPTING TEXT --- */
        .decrypting {
            font-family: 'Space Mono', monospace;
        }

        /* --- NAV ANIMATIONS --- */
        .nav-item-crazy:hover span {
            animation: icon-displace 0.1s infinite;
            text-shadow: 5px 0 #ff00c1, -5px 0 #00fff9;
        }
        .nav-item-crazy:hover {
            background: rgba(255, 255, 255, 0.1) !important;
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
        }
        @keyframes icon-displace {
            0% { transform: translate(0,0); }
            20% { transform: translate(-10px, 5px); }
            40% { transform: translate(10px, -5px); }
            60% { transform: translate(-5px, -10px); }
            80% { transform: translate(5px, 10px); }
            100% { transform: translate(0,0); }
        }
      `}</style>
      
      {/* CRT & NOISE OVERLAYS */}
      <div className="crt-overlay"></div>
      <div className="crt-barrel"></div>
      <div className="scanline"></div>
      <canvas id="noise-canvas" ref={canvasRef}></canvas>

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-xl text-white flex justify-between items-center px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-white animate-pulse">person</span>
          <span className="text-2xl font-black text-white tracking-tighter font-headline">AAPDA</span>
        </div>
        <div className="font-mono text-[10px] text-white/50 tracking-[0.2em] uppercase">
          PROFILE_VOID_STATIC
        </div>
      </header>

      <main className="pt-32 pb-32 px-6 max-w-4xl mx-auto min-h-screen relative z-20 flex flex-col gap-12">
        
        {/* Back Button */}
        <button 
          onClick={onHome}
          className="flex w-fit items-center gap-2 text-white/50 hover:text-white transition-colors font-mono text-xs tracking-widest uppercase mb-[-1rem] cursor-pointer group"
        >
          <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
          RETURN_TO_TERMINAL
        </button>

        {/* Navigation / Logs Links */}
        <div className="flex gap-4 border-b border-white/10 pb-6 mb-4">
          <button className="text-[#c8c6c6] hover:text-white font-mono text-xs tracking-widest uppercase transition-colors">
            [SYSTEM_LOG]
          </button>
          <button className="text-[#c8c6c6] hover:text-white font-mono text-xs tracking-widest uppercase transition-colors">
            [TERMINAL]
          </button>
          <button className="text-white font-mono text-xs tracking-widest uppercase border-b-2 border-white pb-1">
            [ACCOUNT_AUTH]
          </button>
        </div>

        {/* Identity Root */}
        <section className="glass-morphism p-8 md:p-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-30 transition-opacity">
            <span className="material-symbols-outlined text-8xl">badge</span>
          </div>
          
          <div className="flex justify-between items-start mb-4">
            {isEditing ? (
              <input
                type="text"
                value={editForm?.full_name || ''}
                onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                className="font-headline font-black text-5xl md:text-7xl uppercase leading-none tracking-tighter text-white bg-transparent border-b-2 border-white/50 focus:border-white outline-none w-full mr-4"
                placeholder="FULL NAME"
              />
            ) : (
              <h1 
                className="font-headline font-black text-5xl md:text-7xl uppercase leading-none tracking-tighter text-white glitch-text" 
                data-text={formData?.full_name || 'USER_UNKNOWN'}
                onMouseEnter={handleTitleHover}
              >
                {formData?.full_name || 'USER_UNKNOWN'}
              </h1>
            )}
            
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-white/10 text-white border border-white/30 hover:bg-white hover:text-black transition-all px-4 py-2 z-10 font-mono text-xs font-bold tracking-widest flex items-center gap-2 uppercase whitespace-nowrap"
                title="EDIT_PROFILE"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
                EDIT DETAILS
              </button>
            )}
          </div>
          
          <div className="h-1 w-24 bg-[#ff3b3b] mb-8 shadow-[0_0_15px_rgba(255,59,59,0.7)] animate-pulse"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-black/50 border border-white/10 p-6 flex flex-col gap-2">
              <span className="font-mono text-[10px] text-[#919191] uppercase tracking-[0.3em]">PRIMARY_EMAIL</span>
              <span className="font-mono text-sm md:text-base text-white/70 font-bold tracking-widest truncate">
                {formData?.email || authUser?.email || 'N/A'} (LOCKED)
              </span>
            </div>
            
            <div className="bg-black/50 border border-white/10 p-6 flex flex-col gap-2">
              <span className="font-mono text-[10px] text-[#919191] uppercase tracking-[0.3em]">CONTACT_COMMS</span>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm?.phone_number || ''}
                  onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
                  className="font-mono text-sm md:text-base text-white bg-black/50 border border-white/30 p-2 outline-none focus:border-white"
                  placeholder="PHONE NUMBER"
                />
              ) : (
                <span className="font-mono text-sm md:text-base text-white font-bold tracking-widest">
                  {formData?.phone_number || 'N/A'}
                </span>
              )}
            </div>
          </div>

          <div className="bg-black/50 border border-white/10 p-6 flex flex-col gap-2 mb-8">
            <span className="font-mono text-[10px] text-[#919191] uppercase tracking-[0.3em]">GEOLOCATION_NODE</span>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={editForm?.country || ''} onChange={(e) => setEditForm({...editForm, country: e.target.value})} className="font-mono text-sm md:text-base text-white bg-black/50 border border-white/30 p-2 outline-none focus:border-white" placeholder="COUNTRY" />
                <input type="text" value={editForm?.state || ''} onChange={(e) => setEditForm({...editForm, state: e.target.value})} className="font-mono text-sm md:text-base text-white bg-black/50 border border-white/30 p-2 outline-none focus:border-white" placeholder="STATE" />
                <input type="text" value={editForm?.region || ''} onChange={(e) => setEditForm({...editForm, region: e.target.value})} className="font-mono text-sm md:text-base text-white bg-black/50 border border-white/30 p-2 outline-none focus:border-white" placeholder="REGION" />
                <input type="text" value={editForm?.pin || ''} onChange={(e) => setEditForm({...editForm, pin: e.target.value})} className="font-mono text-sm md:text-base text-white bg-black/50 border border-white/30 p-2 outline-none focus:border-white" placeholder="PIN" />
              </div>
            ) : (
              <span className="font-mono text-sm md:text-base text-white font-bold uppercase tracking-widest">
                {formData?.region ? `${formData.region}, ` : ''}{formData?.state || 'UNKNOWN STATE'}, {formData?.country || 'INDIA'} {formData?.pin ? `[${formData.pin}]` : ''}
              </span>
            )}
          </div>

          <div className="bg-black/50 border border-white/10 p-6 flex flex-col gap-2 mb-8">
            <span className="font-mono text-[10px] text-[#919191] uppercase tracking-[0.3em]">SYSTEM_LOCALE</span>
            {isEditing ? (
              <input
                type="text"
                value={editForm?.detected_locale || ''}
                onChange={(e) => setEditForm({...editForm, detected_locale: e.target.value})}
                className="font-mono text-sm md:text-base text-white bg-black/50 border border-white/30 p-2 outline-none focus:border-white"
                placeholder="SYSTEM LOCALE"
              />
            ) : (
              <>
                <span className="font-mono text-sm md:text-base text-white font-bold uppercase tracking-widest">
                  {formData?.detected_locale || 'AUTO-DETECT'}
                </span>
                {formData?.emergency_override_english && (
                  <span className="text-[10px] text-yellow-500 font-mono mt-1 uppercase">** ENGLISH_OVERRIDE_ACTIVE **</span>
                )}
              </>
            )}
          </div>

          {isEditing && (
            <div className="grid grid-cols-2 gap-4 mt-8 mb-4">
              <button 
                onClick={() => setIsEditing(false)}
                className="bg-black/50 border border-white/30 p-4 text-white hover:bg-white/10 transition-colors font-mono tracking-widest"
                disabled={isSaving}
              >
                CANCEL
              </button>
              <button 
                onClick={handleSave}
                className="bg-white text-black p-4 font-bold hover:bg-white/90 transition-colors font-mono tracking-widest flex items-center justify-center gap-2"
                disabled={isSaving}
              >
                {isSaving ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : null}
                {isSaving ? 'SAVING...' : 'SAVE_CHANGES'}
              </button>
            </div>
          )}

          {!isEditing && (
            <button 
              type="button"
              className="w-full bg-black/50 border border-[#ff3b3b]/50 p-6 flex flex-col gap-2 mt-12 cursor-pointer hover:bg-[#ff3b3b]/10 transition-colors relative z-50" 
              onClick={(e) => {
                e.preventDefault();
                onSignOut();
              }}
            >
              <span className="font-mono text-sm text-[#ff3b3b] font-bold uppercase tracking-widest flex items-center justify-center gap-3">
                <span className="material-symbols-outlined">logout</span>
                INITIATE_PROTOCOL_SIGNOUT
              </span>
            </button>
          )}
        </section>

      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-stretch bg-[#0a0a0a]/90 backdrop-blur-3xl z-50 border-t border-white/10">
        <button onClick={onAI} className="flex flex-col items-center justify-center text-[#919191] w-full h-full transition-all group nav-item-crazy gap-1">
          <span className="material-symbols-outlined transition-transform text-2xl">psychology</span>
          <span className="font-mono text-[8px] uppercase tracking-widest">NEURAL</span>
        </button>
        <button onClick={onHome} className="flex flex-col items-center justify-center text-[#919191] w-full h-full transition-all group nav-item-crazy gap-1 border-x border-white/5 bg-white/5">
          <span className="material-symbols-outlined transition-transform text-2xl">home</span>
          <span className="font-mono text-[8px] uppercase tracking-widest">CORE</span>
        </button>
        <button className="flex flex-col items-center justify-center text-white w-full h-full transition-all group nav-item-crazy gap-1 bg-white/10 shadow-[inset_0_-2px_0_white]">
          <span className="material-symbols-outlined transition-transform text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]">person</span>
          <span className="font-mono text-[8px] uppercase tracking-widest font-bold">PROFILE</span>
        </button>
      </nav>
    </div>
  );
}
