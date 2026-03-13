import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg viewBox="0 0 550 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* ECO - Lime Green (#A8C43B) */}
        <g fill="#A8C43B">
          {/* E - Clean Blocky Style */}
          <path d="M10 30H75V45H30V53H70V67H30V75H75V90H10V30Z" />
          
          {/* C - Clean Blocky Style */}
          <path d="M85 30H145V45H105V75H145V90H85V30Z" />
          
          {/* O - Solid Green Square */}
          <rect x="155" y="30" width="65" height="60" rx="2" />
        </g>

        
        {/* Orange Square inside O */}
        <g>
          <rect x="162" y="42" width="41" height="36" fill="#F39233" rx="2" />
          <rect x="164" y="44" width="37" height="32" stroke="white" strokeWidth="2" fill="none" rx="1" />
        </g>
        
        {/* AIR - Bright Blue (#00AEEF) */}
        <g fill="#00AEEF">
          {/* A - Slanted left leg connected to O */}
          <path d="M215 90L245 30H295V90H275V65H245L235 90H215ZM250 45V55H275V45H250Z" />
          {/* I */}
          <rect x="305" y="30" width="20" height="60" rx="2" />
          {/* R - Slanted top right and leg */}
          <path d="M335 30H385C393 30 400 37 400 45V55C400 60 395 65 390 65L410 90H385L370 65H355V90H335V30ZM355 45V55H380V45H355Z" />
        </g>
        
        {/* BK Group */}
        <g transform="translate(425, 30)">
           {/* B - Lime Green (#A8C43B) */}
           <path d="M0 0H42C48 0 52 4 52 10V25C52 28 50 30 47 30C50 30 52 32 52 35V50C52 56 48 60 42 60H0V0Z" fill="#A8C43B" />
           {/* White holes for B to make it look like the photo */}
           <rect x="14" y="10" width="24" height="12" fill="white" rx="2" />
           <rect x="14" y="38" width="24" height="12" fill="white" rx="2" />
           
           {/* Orange Bar - Starts from the very left edge of B */}
           <rect x="0" y="44" width="40" height="8" fill="#F39233" rx="1" />
           
           {/* K - Bright Blue (#00AEEF) - Overlapping the B slightly */}
           <path d="M44 0H64V25L94 0H119L84 30L119 60H94L64 35V60H44V0Z" fill="#00AEEF" />
        </g>


      </svg>
    </div>
  );
};









