import React, { useState, useRef, useEffect } from 'react';

/**
 * Mobile version of CRT monitor frame for portrait orientation.
 * Uses mobileframe2.jpeg - grimy CRT bezel border with black center.
 */
const CRTMonitorFrameMobile = ({ children }) => {
  const [isMuted, setIsMuted] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.3;
      if (!isMuted) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isMuted]);
  // Screen position percentages - adjusted for mobileframe.jpeg
  // The black center area where terminal content renders
  const screen = {
    top: '13%',
    left: '16%',
    width: '68%',
    height: '73%',
    borderRadius: '1%',
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0a',
      padding: '0',
      boxSizing: 'border-box',
      overflow: 'hidden',
    }}>
      {/* Monitor container - maintains 9:16 aspect ratio */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        maxHeight: '100vh',
      }}>
        {/* The CRT monitor frame image (background) */}
        <img
          src="/mobileframe3.jpeg"
          alt="CRT Monitor"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* Screen content area - positioned over the monitor screen */}
        <div style={{
          position: 'absolute',
          top: screen.top,
          left: screen.left,
          width: screen.width,
          height: screen.height,
          zIndex: 2,
          overflow: 'hidden',
          borderRadius: screen.borderRadius,
        }}>
          {/* Terminal content */}
          <div style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {children}
          </div>
        </div>

        {/* Audio element */}
        <audio ref={audioRef} src="/sounds/hum.mp3" loop />

        {/* Controls row - fixed at bottom of viewport */}
        <div style={{
          position: 'fixed',
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          zIndex: 100,
          background: 'rgba(0,0,0,0.6)',
          padding: '8px 16px',
          borderRadius: '24px',
          border: '1px solid rgba(255,176,0,0.3)',
        }}>
          {/* Share on X/Twitter */}
          <button
            onClick={() => {
              const text = "Just discovered this Stranger Things terminal from Hawkins Lab... 👀🔦";
              const url = window.location.href;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid #ffb000',
              background: 'rgba(0,0,0,0.7)',
              color: '#ffb000',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
            title="Share on X"
          >
            𝕏
          </button>

          {/* Share on Facebook */}
          <button
            onClick={() => {
              const url = window.location.href;
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid #ffb000',
              background: 'rgba(0,0,0,0.7)',
              color: '#ffb000',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
            title="Share on Facebook"
          >
            f
          </button>

          {/* Share on Reddit */}
          <button
            onClick={() => {
              const title = "Stranger Things terminal from Hawkins National Laboratory";
              const url = window.location.href;
              window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid #ffb000',
              background: 'rgba(0,0,0,0.7)',
              color: '#ffb000',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Share on Reddit"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
            </svg>
          </button>

          {/* Copy link */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied!');
            }}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid #ffb000',
              background: 'rgba(0,0,0,0.7)',
              color: '#ffb000',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Copy link"
          >
            🔗
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '2px solid #ffb000',
              background: isMuted ? 'rgba(0,0,0,0.7)' : 'rgba(255,176,0,0.2)',
              color: '#ffb000',
              fontSize: '16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isMuted ? 'none' : '0 0 10px rgba(255,176,0,0.5)',
            }}
            title={isMuted ? 'Enable CRT hum' : 'Mute CRT hum'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CRTMonitorFrameMobile;
