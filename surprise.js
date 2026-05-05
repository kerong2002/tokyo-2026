// ─────────────────────────────────────────────────────────
// runtime utilities — handles ambient interaction layer
// ─────────────────────────────────────────────────────────
(function () {
  function fromB64(s) {
    const bin = atob(s);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function unlock(pwd) {
    const data = window.__rt;
    if (!data) throw new Error('no payload');
    const enc = new TextEncoder();
    const km = await crypto.subtle.importKey('raw', enc.encode(pwd), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: fromB64(data.s), iterations: 250000, hash: 'SHA-256' },
      km, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
    );
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(data.i) }, key, fromB64(data.c));
    return JSON.parse(new TextDecoder().decode(pt));
  }

  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'style') Object.assign(e.style, attrs[k]);
      else if (k === 'onclick') e.onclick = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      if (Array.isArray(c)) { for (const x of c) if (x != null) e.appendChild(typeof x === 'string' ? document.createTextNode(x) : x); }
      else e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }

  // ─── Floating bouquet button ─────────────────────────────
  const bouquet = el('button', {
    id: 'rt-bouquet',
    'aria-label': 'flower',
    style: {
      position: 'fixed', right: '20px', bottom: '20px',
      width: '64px', height: '64px', borderRadius: '50%',
      border: '2px solid #1C1A17', background: '#FFF',
      cursor: 'pointer', fontSize: '32px', lineHeight: '60px',
      padding: '0', zIndex: '90',
      boxShadow: '0 6px 22px rgba(194,65,12,0.35), 0 0 0 6px rgba(245,241,234,0.6)',
      transition: 'transform .25s, background .25s',
      fontFamily: 'inherit',
      animation: 'rtPulse 2.6s ease-in-out infinite',
    }
  }, '💐');
  bouquet.addEventListener('mouseenter', () => { bouquet.style.transform = 'scale(1.1) rotate(-8deg)'; });
  bouquet.addEventListener('mouseleave', () => { bouquet.style.transform = ''; });

  // ─── Step 1: Ask ─────────────────────────────────────────
  function showAsk() {
    const overlay = el('div', { id: 'rt-overlay-ask', style: overlayStyle() });
    const card = el('div', { style: cardStyle() },
      el('div', { style: { fontSize: '11px', letterSpacing: '0.22em', color: '#C2410C', textTransform: 'uppercase', marginBottom: '12px' } }, '★ FOR YOU ★'),
      el('div', { style: { fontSize: '54px', marginBottom: '12px', animation: 'rtBob 2.4s ease-in-out infinite' } }, '💐'),
      el('h2', { style: { fontFamily: '"Noto Serif TC","Noto Serif JP",serif', fontSize: '26px', margin: '0 0 8px', fontWeight: '500' } }, '你想要一個驚喜嗎？'),
      el('p', { style: { fontSize: '13px', color: '#6B6358', margin: '0 0 22px', lineHeight: '1.6' } }, '我幫你藏了一點小東西…'),
      el('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center' } },
        el('button', { style: btnStyle('ghost'), onclick: () => overlay.remove() }, '下次再說'),
        el('button', { style: btnStyle('solid'), onclick: () => { overlay.remove(); showPwd(); } }, '我想要 ✦'),
      ),
    );
    overlay.appendChild(card);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // ─── Step 2: Password ────────────────────────────────────
  function showPwd() {
    const overlay = el('div', { id: 'rt-overlay-pwd', style: overlayStyle() });
    const input = el('input', {
      type: 'password',
      placeholder: '輸入暗號',
      autocomplete: 'off',
      style: {
        fontFamily: 'inherit', fontSize: '18px', padding: '12px 14px', width: '100%',
        border: '1px solid #1C1A17', background: '#F5F1EA',
        textAlign: 'center', letterSpacing: '0.3em',
        outline: 'none', marginBottom: '14px', boxSizing: 'border-box',
      }
    });
    const errEl = el('div', { style: { fontSize: '12px', color: '#C2410C', minHeight: '16px', marginBottom: '8px', letterSpacing: '0.08em' } }, '');
    async function tryUnlock() {
      const pwd = input.value.trim();
      if (!pwd) return;
      try {
        const payload = await unlock(pwd);
        overlay.remove();
        showSurprise(payload);
      } catch {
        errEl.textContent = '不是這個暗號 ♡ 再想想看';
        input.value = '';
        input.focus();
      }
    }
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryUnlock(); });
    const card = el('div', { style: cardStyle() },
      el('div', { style: { fontSize: '11px', letterSpacing: '0.22em', color: '#C2410C', textTransform: 'uppercase', marginBottom: '12px' } }, '— Secret —'),
      el('h2', { style: { fontFamily: '"Noto Serif TC","Noto Serif JP",serif', fontSize: '22px', margin: '0 0 18px', fontWeight: '500' } }, '需要一個小小的暗號'),
      el('div', { style: { fontSize: '11px', color: '#6B6358', marginBottom: '14px', letterSpacing: '0.08em' } }, '提示：他的英文名字 ✦'),
      input,
      errEl,
      el('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center' } },
        el('button', { style: btnStyle('ghost'), onclick: () => overlay.remove() }, '取消'),
        el('button', { style: btnStyle('solid'), onclick: tryUnlock }, '打開 →'),
      ),
    );
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    setTimeout(() => input.focus(), 100);
  }

  // ─── Step 3: Reveal ──────────────────────────────────────
  function showSurprise(payload) {
    const overlay = el('div', {
      id: 'rt-overlay-surprise',
      style: {
        position: 'fixed', inset: '0', zIndex: '200',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '0',
        animation: 'rtFade .4s ease-out',
      }
    });

    // Background photo (full bleed) + dark gradient
    const bgPhoto = el('div', {
      style: {
        position: 'fixed', inset: '0', zIndex: '0',
        backgroundImage: `url(${payload.photo})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'blur(2px) brightness(0.55) saturate(1.1)',
        transform: 'scale(1.05)',
        animation: 'rtKenBurns 24s ease-in-out infinite alternate',
      }
    });
    const bgVignette = el('div', {
      style: {
        position: 'fixed', inset: '0', zIndex: '0',
        background: 'radial-gradient(ellipse at center, rgba(28,26,23,0.35) 0%, rgba(28,26,23,0.85) 100%)',
      }
    });

    // ─── Falling petals layer ───
    const fx = el('div', { style: { position: 'fixed', inset: '0', pointerEvents: 'none', overflow: 'hidden', zIndex: '1' } });
    const symbols = ['❀','✿','♡','✦','❁','♥','✺','❃','✾'];
    const colors = ['#F8B4A0','#E0B574','#FFD4B8','#FFF1E5','#F5C6B0','#F0A88C','#FFE0CC'];
    for (let i = 0; i < 50; i++) {
      const s = el('span', {
        style: {
          position: 'absolute',
          left: (Math.random() * 100) + '%',
          top: (-10 - Math.random() * 40) + '%',
          fontSize: (12 + Math.random() * 22) + 'px',
          color: colors[i % colors.length],
          textShadow: '0 0 12px rgba(255,200,160,0.6)',
          animation: `rtFall ${6 + Math.random() * 6}s linear ${Math.random() * 5}s infinite`,
          opacity: 0.9,
        }
      }, symbols[i % symbols.length]);
      fx.appendChild(s);
    }

    // ─── Floating sparkles ───
    const sparkleLayer = el('div', { style: { position: 'fixed', inset: '0', pointerEvents: 'none', zIndex: '2' } });
    for (let i = 0; i < 20; i++) {
      const sp = el('span', {
        style: {
          position: 'absolute',
          left: (Math.random() * 100) + '%',
          top: (Math.random() * 100) + '%',
          fontSize: (8 + Math.random() * 10) + 'px',
          color: '#FFE0CC',
          textShadow: '0 0 8px rgba(255,220,180,0.9)',
          animation: `rtTwinkle ${1.4 + Math.random() * 2.5}s ease-in-out ${Math.random() * 3}s infinite`,
        }
      }, '✦');
      sparkleLayer.appendChild(sp);
    }

    // ─── Header card with cake ───
    const headerCard = el('div', {
      style: {
        position: 'relative', zIndex: '5',
        margin: '60px auto 24px', maxWidth: '640px', width: 'calc(100% - 32px)',
        textAlign: 'center', color: '#FFF',
        animation: 'rtPop .55s cubic-bezier(.2,.9,.3,1.2)',
      }
    },
      el('div', {
        style: {
          fontSize: '110px', textAlign: 'center', margin: '0',
          animation: 'rtBob 2.4s ease-in-out infinite',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))',
        }
      }, '🎂'),
      el('div', {
        style: {
          fontSize: '11px', letterSpacing: '0.4em', color: '#FFD4B8',
          textTransform: 'uppercase', marginTop: '6px',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }
      }, '✦ ✦ ✦  H A P P Y  D A Y  ✦ ✦ ✦'),
      el('h2', {
        style: {
          fontFamily: '"Noto Serif JP","Noto Serif TC",serif',
          fontSize: 'clamp(40px, 8vw, 64px)', margin: '14px 0 6px',
          fontWeight: '500', letterSpacing: '0.12em',
          textShadow: '0 4px 24px rgba(194,65,12,0.6), 0 2px 8px rgba(0,0,0,0.4)',
          background: 'linear-gradient(135deg, #FFF 0%, #FFE0CC 50%, #F8B4A0 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }
      }, '生日快樂'),
      el('div', {
        style: {
          fontSize: '13px', letterSpacing: '0.32em', color: '#FFD4B8',
          textTransform: 'uppercase', marginTop: '4px',
          textShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }
      }, 'Happy Birthday'),
      payload.tagline && el('div', {
        style: {
          fontFamily: '"Noto Serif TC",serif',
          fontSize: '20px', marginTop: '20px',
          color: '#FFE0CC',
          letterSpacing: '0.08em',
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
          animation: 'rtGlow 2.8s ease-in-out infinite',
        }
      }, payload.tagline),
    );

    // ─── Letter card ───
    const letterLines = payload.letter.split('\n').map((line) =>
      el('p', {
        style: {
          margin: line.trim() === '' ? '10px 0' : '0 0 12px',
          lineHeight: '1.95',
          fontSize: '15px',
          color: '#1C1A17',
          fontFamily: '"Noto Serif TC","Noto Serif JP","Songti TC",serif',
        }
      }, line)
    );

    const letterCard = el('div', {
      style: {
        position: 'relative', zIndex: '5',
        background: 'rgba(245,241,234,0.97)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(194,65,12,0.3)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,224,204,0.4)',
        margin: '0 auto 24px', maxWidth: '560px', width: 'calc(100% - 32px)',
        padding: '34px 30px',
        textAlign: 'left',
        animation: 'rtPop .7s cubic-bezier(.2,.9,.3,1.2) .15s both',
      }
    },
      // Decorative top
      el('div', {
        style: {
          textAlign: 'center', fontSize: '14px', letterSpacing: '0.4em',
          color: '#C2410C', marginBottom: '6px',
        }
      }, '✿  ❀  ✿'),
      el('div', {
        style: {
          fontFamily: '"Noto Serif TC","Noto Serif JP",serif',
          fontSize: '24px', marginBottom: '20px', fontWeight: '500',
          textAlign: 'center',
          paddingBottom: '14px',
          borderBottom: '1px solid #C8BEAB',
        }
      }, payload.to + '，'),
      ...letterLines,
      el('div', {
        style: {
          marginTop: '24px', textAlign: 'right',
          fontFamily: '"Noto Serif TC",serif',
          fontSize: '15px', color: '#1C1A17', lineHeight: '1.6',
        }
      },
        el('div', null, payload.signoff),
        el('div', {
          style: {
            fontSize: '22px', marginTop: '6px',
            letterSpacing: '0.1em', fontWeight: '500',
            color: '#C2410C',
          }
        }, payload.from + ' ♡'),
      ),
      el('div', {
        style: {
          textAlign: 'center', fontSize: '14px', letterSpacing: '0.4em',
          color: '#C2410C', marginTop: '18px',
        }
      }, '✿  ❀  ✿'),
    );

    // ─── Photo card ───
    const photoCard = el('div', {
      style: {
        position: 'relative', zIndex: '5',
        margin: '0 auto 24px', maxWidth: '420px', width: 'calc(100% - 32px)',
        animation: 'rtPop .8s cubic-bezier(.2,.9,.3,1.2) .3s both',
      }
    },
      el('div', {
        style: {
          background: '#FFF',
          padding: '12px 12px 50px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          transform: 'rotate(-2deg)',
          transition: 'transform .35s',
          cursor: 'default',
        },
        onmouseenter: function() { this.style.transform = 'rotate(0deg) scale(1.02)'; },
        onmouseleave: function() { this.style.transform = 'rotate(-2deg)'; },
      },
        el('img', {
          src: payload.photo,
          alt: 'us',
          style: { width: '100%', display: 'block', filter: 'saturate(1.05) contrast(1.02)' }
        }),
        el('div', {
          style: {
            textAlign: 'center', fontFamily: '"Caveat","Noto Serif TC",cursive',
            fontSize: '20px', color: '#1C1A17', marginTop: '14px',
            letterSpacing: '0.05em',
          }
        }, '✦  我們  ✦'),
      ),
    );

    // ─── Close button ───
    const closeBtn = el('div', {
      style: {
        position: 'relative', zIndex: '5',
        textAlign: 'center', margin: '0 auto 60px',
        animation: 'rtPop .9s cubic-bezier(.2,.9,.3,1.2) .45s both',
      }
    },
      el('button', {
        style: {
          ...btnStyle('solid'),
          background: 'linear-gradient(135deg, #C2410C, #D97757)',
          color: '#FFF',
          border: '1px solid rgba(255,224,204,0.6)',
          padding: '14px 32px',
          fontSize: '14px',
          letterSpacing: '0.18em',
          boxShadow: '0 8px 20px rgba(194,65,12,0.5)',
        },
        onclick: () => overlay.remove(),
      }, '收下這份心意 ♡'),
    );

    overlay.appendChild(bgPhoto);
    overlay.appendChild(bgVignette);
    overlay.appendChild(fx);
    overlay.appendChild(sparkleLayer);
    overlay.appendChild(headerCard);
    overlay.appendChild(letterCard);
    overlay.appendChild(photoCard);
    overlay.appendChild(closeBtn);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target === bgVignette) overlay.remove();
    });
    document.body.appendChild(overlay);
  }

  function overlayStyle() {
    return {
      position: 'fixed', inset: '0',
      background: 'rgba(28,26,23,0.62)',
      backdropFilter: 'blur(3px)',
      zIndex: '200',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
      animation: 'rtFade .25s ease-out',
    };
  }
  function cardStyle() {
    return {
      background: '#F5F1EA', border: '1px solid #1C1A17',
      padding: '32px 26px', maxWidth: '420px', width: '100%',
      textAlign: 'center',
      boxShadow: '0 12px 40px rgba(28,26,23,0.35)',
      animation: 'rtPop .35s cubic-bezier(.2,.9,.3,1.2)',
      boxSizing: 'border-box',
    };
  }
  function btnStyle(kind) {
    const base = {
      fontFamily: 'inherit', fontSize: '13px', padding: '10px 20px',
      letterSpacing: '0.08em', cursor: 'pointer',
      border: '1px solid #1C1A17', transition: 'all .2s',
    };
    return kind === 'solid'
      ? { ...base, background: '#1C1A17', color: '#F5F1EA' }
      : { ...base, background: 'transparent', color: '#1C1A17' };
  }

  const style = document.createElement('style');
  style.textContent = `
    @keyframes rtFade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes rtPop { from { opacity: 0; transform: scale(.92) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes rtBob { 0%,100% { transform: translateY(0) rotate(-2deg); } 50% { transform: translateY(-10px) rotate(3deg); } }
    @keyframes rtFall {
      0% { transform: translateY(0) rotate(0deg); opacity: 0; }
      8% { opacity: 0.9; }
      100% { transform: translateY(115vh) rotate(540deg); opacity: 0; }
    }
    @keyframes rtPulse {
      0%, 100% { box-shadow: 0 6px 22px rgba(194,65,12,0.35), 0 0 0 6px rgba(245,241,234,0.6); }
      50% { box-shadow: 0 6px 28px rgba(194,65,12,0.55), 0 0 0 12px rgba(194,65,12,0.08); }
    }
    @keyframes rtTwinkle {
      0%, 100% { opacity: 0; transform: scale(0.5); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    @keyframes rtKenBurns {
      0% { transform: scale(1.05) translate(0, 0); }
      100% { transform: scale(1.15) translate(-2%, -2%); }
    }
    @keyframes rtGlow {
      0%, 100% { text-shadow: 0 2px 12px rgba(0,0,0,0.6), 0 0 18px rgba(255,180,140,0.4); }
      50% { text-shadow: 0 2px 12px rgba(0,0,0,0.6), 0 0 28px rgba(255,180,140,0.85); }
    }
    #rt-bouquet:hover { background: #FFF !important; }
  `;
  document.head.appendChild(style);

  bouquet.addEventListener('click', showAsk);
  document.body.appendChild(bouquet);
})();
