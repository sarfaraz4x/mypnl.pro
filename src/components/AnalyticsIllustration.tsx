import React from 'react';

const AnalyticsIllustration = () => {
  return (
        <div className="relative w-full mx-auto p-4">
      <svg viewBox="0 0 800 450" className="w-full h-auto">
        {/* Background Glows */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="glow-blue" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="100" y="100" width="600" height="300" fill="url(#glow)" />
        <rect x="300" y="50" width="400" height="300" fill="url(#glow-blue)" />

        {/* Left side: Screenshots */}
        <g className="group animate-fade-in-left">
          <text x="175" y="100" fontFamily="sans-serif" fontSize="16" fill="#94a3b8" textAnchor="middle">Trading Screenshots</text>
          
          {/* Screenshot 2 (bottom) */}
          <g transform="rotate(4 170 215)">
            <defs>
              <clipPath id="clip-path-screenshot-2">
                <rect x="80" y="125" width="220" height="180" rx="12" />
              </clipPath>
            </defs>
            <image 
              href="/screenshot-5.png"
              x="80" y="125" width="220" height="180" 
              clipPath="url(#clip-path-screenshot-2)" 
              preserveAspectRatio="xMidYMid slice"
            />
            <rect x="80" y="125" width="220" height="180" rx="12" fill="none" stroke="#334155" strokeWidth="2" />
          </g>

          {/* Screenshot 1 (top) */}
          <g transform="rotate(-3 150 225)">
            <defs>
              <clipPath id="clip-path-screenshot-1">
                <rect x="60" y="135" width="220" height="180" rx="12" />
              </clipPath>
            </defs>
            <image 
              href="/screenshot-4.jpg"
              x="60" y="135" width="220" height="180" 
              clipPath="url(#clip-path-screenshot-1)" 
              preserveAspectRatio="xMidYMid slice"
            />
            <rect x="60" y="135" width="220" height="180" rx="12" fill="none" stroke="#334155" strokeWidth="2" />
          </g>
        </g>

        {/* Arrow */}
        <path d="M320 225 L 380 225" stroke="#475569" strokeWidth="3" strokeDasharray="5, 5" className="animate-draw-arrow" />
        <path d="M370 215 L 380 225 L 370 235" stroke="#475569" strokeWidth="3" fill="none" className="animate-fade-in" style={{ animationDelay: '1s' }} />

        {/* Right side: Analytics Dashboard */}
        <g className="animate-fade-in-right">
          {/* Main Panel */}
          <rect x="400" y="50" width="350" height="350" rx="12" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          <text x="575" y="80" fontFamily="sans-serif" fontSize="18" fill="#e2e8f0" textAnchor="middle" fontWeight="bold">Analytics Dashboard</text>

          {/* Bar Chart */}
          <g transform="translate(420, 100)">
            <rect width="5" height="30" y="20" fill="#4ade80" className="animate-bar-up" style={{ animationDelay: '1.2s' }} />
            <rect x="10" width="5" height="40" y="10" fill="#4ade80" className="animate-bar-up" style={{ animationDelay: '1.3s' }} />
            <rect x="20" width="5" height="20" y="30" fill="#f87171" className="animate-bar-up" style={{ animationDelay: '1.4s' }} />
            <rect x="30" width="5" height="50" y="0" fill="#4ade80" className="animate-bar-up" style={{ animationDelay: '1.5s' }} />
          </g>

          {/* Trading Chart */}
          <g transform="translate(570, 280)">
            {/* Chart background */}
            <rect x="0" y="0" width="120" height="60" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="2" />
            
            {/* X and Y axes */}
            <line x1="10" y1="50" x2="110" y2="50" stroke="#475569" strokeWidth="1" />
            <line x1="10" y1="10" x2="10" y2="50" stroke="#475569" strokeWidth="1" />
            
            {/* Simple trading curve */}
            <path 
              d="M10 40 Q30 35 50 25 Q70 15 90 20 Q110 30 110 25" 
              stroke="#60a5fa" 
              strokeWidth="2" 
              fill="none" 
              className="animate-draw-line"
              style={{ animationDelay: '2.5s' }}
            />
          </g>

          {/* Pie Chart */}
          <g transform="translate(510, 130)">
            <circle r="25" fill="#f87171" />
            <path d="M 0 0 L 25 0 A 25 25 0 0 1 -12.5 21.65 Z" fill="#4ade80" className="animate-pie-fill" style={{ animationDelay: '1.6s' }} />
          </g>

          {/* PnL Calendar */}
          <g transform="translate(570, 100)">
            <text x="35" y="0" textAnchor="middle" fontSize="12" fill="#94a3b8">PnL Calendar</text>
            {[...Array(4)].map((_, row) =>
              [...Array(7)].map((_, col) => {
                const color = Math.random() > 0.4 ? (Math.random() > 0.5 ? '#4ade80' : '#22c55e') : (Math.random() > 0.5 ? '#f87171' : '#ef4444');
                return <rect key={`${row}-${col}`} x={col * 11} y={row * 11 + 10} width="9" height="9" rx="2" fill={color} className="animate-fade-in" style={{ animationDelay: `${1.8 + (row * 7 + col) * 0.02}s` }} />;
              })
            )}
          </g>

          {/* Key Metrics */}
          <g transform="translate(420, 200)" className="animate-fade-in" style={{ animationDelay: '2s' }}>
            <text y="0" fontSize="14" fill="#94a3b8">Total PnL:</text>
            <text y="20" fontSize="14" fill="#4ade80" fontWeight="bold">+$1,250.75</text>
            <text y="50" fontSize="14" fill="#94a3b8">Best Trade:</text>
            <text y="70" fontSize="16" fill="#60a5fa">+$340.10</text>
            <text y="100" fontSize="14" fill="#94a3b8">Worst Trade:</text>
                        <text y="120" fontSize="16" fill="#f472b6">-$120.50</text>

            <text x="160" y="0" fontSize="14" fill="#94a3b8">Total Lots:</text>
            <text x="160" y="20" fontSize="18" fill="#e2e8f0" fontWeight="bold">12.5</text>
          </g>

          {/* Input Trades Table */}
          <g transform="translate(570, 180)" className="animate-fade-in" style={{ animationDelay: '2.2s' }}>
            <text y="0" fontSize="10" fill="#94a3b8">Recent Trades</text>
            <rect y="8" width="130" height="75" rx="4" fill="#0f172a" />
            <text x="8" y="22" fontFamily="monospace" fontSize="10" fill="#cbd5e1">GOLD</text>
            <text x="70" y="22" fontFamily="monospace" fontSize="10" fill="#4ade80">+$152.30</text>
            <line x1="5" y1="30" x2="125" y2="30" stroke="#334155" strokeWidth="1"/>
            <text x="8" y="44" fontFamily="monospace" fontSize="10" fill="#cbd5e1">EURUSD</text>
            <text x="70" y="44" fontFamily="monospace" fontSize="10" fill="#f87171">-$78.50</text>
            <line x1="5" y1="52" x2="125" y2="52" stroke="#334155" strokeWidth="1"/>
            <text x="8" y="66" fontFamily="monospace" fontSize="10" fill="#cbd5e1">GBPUSD</text>
                        <text x="70" y="66" fontFamily="monospace" fontSize="10" fill="#4ade80">+$210.00</text>
          </g>

          {/* Export Buttons */}
                    <g transform="translate(420, 350)" className="animate-fade-in" style={{ animationDelay: '2.4s' }}>
            <text y="0" fontSize="12" fill="#94a3b8">Export Analytics</text>
            {/* PDF Button */}
            <rect y="10" width="150" height="30" rx="4" fill="#334155" />
            <text x="45" y="30" fontFamily="sans-serif" fontSize="12" fill="#e2e8f0">Export as PDF</text>
            <path d="M20 18 L20 28 L35 28 L35 18" stroke="#f472b6" strokeWidth="1.5" fill="none"/>
            <text x="23" y="26" fontFamily="monospace" fontSize="10" fill="#f472b6">PDF</text>

            {/* Excel Button */}
            <rect x="180" y="10" width="150" height="30" rx="4" fill="#334155" />
            <text x="220" y="30" fontFamily="sans-serif" fontSize="12" fill="#e2e8f0">Export as Excel</text>
            <path d="M195 18 L195 28 L210 28 L210 18 Z M 195 23 L 210 23" stroke="#4ade80" strokeWidth="1.5" fill="none" />
          </g>
        </g>

        <style>{`
          @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fade-in 1s ease-out forwards; opacity: 0; }
          
          @keyframes fade-in-left { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
          .animate-fade-in-left { animation: fade-in-left 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; opacity: 0; }

          @keyframes fade-in-right { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          .animate-fade-in-right { animation: fade-in-right 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) 1s forwards; opacity: 0; }

          @keyframes draw-arrow {
            to { stroke-dashoffset: 0; }
          }
          .animate-draw-arrow {
            stroke-dashoffset: 60;
            animation: draw-arrow 0.5s linear 0.8s forwards;
          }

          @keyframes bar-up {
            from { transform: scaleY(0); }
            to { transform: scaleY(1); }
          }
          .animate-bar-up { transform-origin: bottom; animation: bar-up 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; transform: scaleY(0); }

          @keyframes pie-fill {
            from { transform: rotate(-90deg); }
            to { transform: rotate(0deg); }
          }
          .animate-pie-fill { transform-origin: center; animation: pie-fill 0.8s cubic-bezier(0.5, 0, 0.5, 1) forwards; }

          @keyframes draw-line {
            from { stroke-dasharray: 0 1000; }
            to { stroke-dasharray: 1000 0; }
          }
          .animate-draw-line { 
            stroke-dasharray: 0 1000;
            animation: draw-line 1.5s ease-out forwards; 
          }

        `}</style>
      </svg>
    </div>
  );
};

export default AnalyticsIllustration;
