import React from 'react';
import { UserRole } from '../../types';

interface RoleIcon25DProps {
  role: UserRole | 'water' | 'feed' | 'pond' | 'alert' | 'trace';
  size?: number; // size in px, default 56
  className?: string;
}

export const RoleIcon25D: React.FC<RoleIcon25DProps> = ({ role, size = 56, className = '' }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_4px_8px_rgba(255,122,26,0.28)]"
      >
        <defs>
          {/* Main 2.5D Orange Gradients */}
          <linearGradient id="orange25DMain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFA64D" />
            <stop offset="45%" stopColor="#FF7A1A" />
            <stop offset="100%" stopColor="#E25800" />
          </linearGradient>

          <linearGradient id="orange25DHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF2E8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FF7A1A" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="orange25DDark" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E25800" />
            <stop offset="100%" stopColor="#B33E00" />
          </linearGradient>

          {/* Crisp White Outline Filter */}
          <filter id="whiteStickerOutline" x="-20%" y="-20%" width="140%" height="140%">
            <feMorphology in="SourceAlpha" result="DILATED" operator="dilate" radius="2" />
            <feFlood floodColor="#FFFFFF" result="WHITE" />
            <feComposite in="WHITE" in2="DILATED" operator="in" result="OUTLINE" />
            <feMerge>
              <feMergeNode in="OUTLINE" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. OWNER: Fisherman with casting net (ชาวประมงถือแห) */}
        {role === 'owner' && (
          <g filter="url(#whiteStickerOutline)">
            {/* Net (แหจับปลา/กุ้ง) */}
            <path
              d="M38 14 C44 12, 54 18, 56 30 C57 37, 52 44, 42 42 Z"
              fill="#FFA64D"
              stroke="#B33E00"
              strokeWidth="1.2"
              strokeDasharray="2.5 1.5"
              fillOpacity="0.45"
            />
            <path d="M40 18 L54 36 M46 14 L50 42 M40 26 L56 24 M42 34 L56 32" stroke="#FFF" strokeWidth="0.8" opacity="0.8" />
            
            {/* Fisherman Hat (หมวกงอบชาวประมงทรงแหลม) */}
            <polygon points="20,13 10,21 30,21" fill="url(#orange25DMain)" stroke="#B33E00" strokeWidth="1" />
            <ellipse cx="20" cy="21" rx="10" ry="2" fill="url(#orange25DDark)" />
            {/* Head */}
            <circle cx="20" cy="24" r="4.5" fill="#FFA64D" stroke="#B33E00" strokeWidth="0.8" />
            {/* Torso & Shirt */}
            <path d="M14 28 C14 27, 26 27, 26 28 L28 42 L12 42 Z" fill="url(#orange25DMain)" />
            {/* Left Arm holding net cord */}
            <path d="M26 30 L38 20" stroke="url(#orange25DDark)" strokeWidth="3" strokeLinecap="round" />
            {/* Right Arm */}
            <path d="M14 30 L10 38" stroke="url(#orange25DDark)" strokeWidth="3" strokeLinecap="round" />
            {/* Legs & Fisher Boots */}
            <rect x="14" y="42" width="4.5" height="12" rx="2" fill="url(#orange25DDark)" />
            <rect x="21" y="42" width="4.5" height="12" rx="2" fill="url(#orange25DDark)" />
            <path d="M12 52 H19 V55 H12 Z M19 52 H26 V55 H19 Z" fill="#7C2D00" />
          </g>
        )}

        {/* 2. TECHNICIAN: Double-ended Wrench (ประแจช่าง) */}
        {role === 'technician' && (
          <g filter="url(#whiteStickerOutline)">
            <g transform="rotate(-35 32 32)">
              {/* Drop shadow edge */}
              <path
                d="M18 27 L22 31 L42 31 L46 27 C49 29 52 33 50 37 L44 37 L40 43 L45 48 C41 51 36 51 33 48 L29 44 L25 48 C21 46 19 41 21 37 L27 37 L25 31 Z"
                fill="#B33E00"
                opacity="0.3"
                transform="translate(2, 3)"
              />
              {/* Main Wrench Body */}
              <path
                d="M16 26 C13 28 11 33 13 38 C15 42 19 44 24 43 L38 43 C43 44 47 42 49 38 C51 33 49 28 46 26 L42 30 L38 30 L36 26 L26 26 L24 30 L20 30 Z"
                fill="url(#orange25DMain)"
              />
              {/* Chrome/Glossy Bevel Line */}
              <rect x="24" y="30" width="16" height="4" rx="2" fill="url(#orange25DHighlight)" />
              {/* Grip Indent */}
              <rect x="28" y="31" width="8" height="2" rx="1" fill="#FFF" opacity="0.7" />
              {/* Realistic 2.5D Wrench Heads */}
              <path d="M13 28 L19 32 L21 29 L16 24 Z" fill="url(#orange25DDark)" />
              <path d="M47 28 L41 32 L39 29 L44 24 Z" fill="url(#orange25DDark)" />
            </g>
          </g>
        )}

        {/* 3. HATCHERY: Curled Shrimp (กุ้ง) */}
        {role === 'hatchery' && (
          <g filter="url(#whiteStickerOutline)">
            {/* Long Feelers/Antennae */}
            <path d="M22 26 C14 20, 10 12, 14 6 M22 28 C16 24, 12 18, 18 10" stroke="#FFA64D" strokeWidth="1.8" strokeLinecap="round" />
            {/* Rostrum (กรีแหลมบนหัว) */}
            <path d="M18 24 L10 22 L22 30 Z" fill="#E25800" />
            {/* Cephalothorax (หัวกุ้ง) */}
            <ellipse cx="27" cy="30" rx="9" ry="7" fill="url(#orange25DMain)" />
            {/* Shrimp Eye */}
            <circle cx="20" cy="28" r="2" fill="#201000" />
            <circle cx="19.5" cy="27.5" r="0.7" fill="#FFF" />
            {/* Curved Abdominal Segments (ปล้องตัวกุ้งโค้ง) */}
            <path d="M32 26 C36 24, 43 28, 45 34 L38 36 Z" fill="url(#orange25DMain)" stroke="#B33E00" strokeWidth="0.8" />
            <path d="M38 33 C42 34, 48 40, 46 47 L40 43 Z" fill="url(#orange25DMain)" stroke="#B33E00" strokeWidth="0.8" />
            <path d="M41 42 C43 45, 43 51, 38 55 L35 48 Z" fill="url(#orange25DMain)" stroke="#B33E00" strokeWidth="0.8" />
            {/* Uropods / Telson (หางกุ้งแผ่) */}
            <path d="M38 55 C42 58, 44 60, 40 62 C36 60, 34 57, 36 54 Z" fill="#E25800" />
            <path d="M34 55 C32 58, 28 60, 26 57 C28 55, 32 53, 34 54 Z" fill="#FFA64D" />
            {/* Walking legs */}
            <path d="M24 37 L20 44 M28 37 L26 45 M32 37 L31 45" stroke="#FFA64D" strokeWidth="1.5" strokeLinecap="round" />
            {/* Highlights */}
            <path d="M24 26 C28 24, 34 25, 38 28" stroke="#FFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          </g>
        )}

        {/* 4. PROCESSOR: Industrial Factory with Chimney (โรงงาน) */}
        {role === 'processor' && (
          <g filter="url(#whiteStickerOutline)">
            {/* Chimney / Smoke stack */}
            <rect x="14" y="14" width="7" height="22" fill="url(#orange25DDark)" />
            <polygon points="13,14 22,14 20,16 15,16" fill="#FFA64D" />
            {/* Smoke puffs */}
            <circle cx="16" cy="10" r="2.5" fill="#FFA64D" opacity="0.6" />
            <circle cx="19" cy="6" r="3.5" fill="#FFA64D" opacity="0.4" />
            {/* Main Sawtooth Factory Building */}
            <path
              d="M10 48 L10 32 L20 38 L20 32 L32 38 L32 30 L46 38 L54 38 L54 48 Z"
              fill="url(#orange25DMain)"
            />
            {/* Factory 2.5D Roof Highlight */}
            <path d="M10 32 L20 38 L20 32 L32 38 L32 30 L46 38 L54 38" stroke="#FFF" strokeWidth="1.2" fill="none" opacity="0.7" />
            {/* Windows & Doors in high contrast */}
            <rect x="14" y="40" width="4" height="5" rx="1" fill="#FFF" />
            <rect x="24" y="40" width="4" height="5" rx="1" fill="#FFF" />
            <rect x="34" y="40" width="4" height="5" rx="1" fill="#FFF" />
            <rect x="44" y="38" width="6" height="10" rx="1" fill="#7C2D00" />
            {/* Ground base shadow */}
            <rect x="8" y="48" width="48" height="4" rx="2" fill="url(#orange25DDark)" />
          </g>
        )}

        {/* 5. EXPORTER: Cargo Delivery Truck (รถบรรทุกส่งออก) */}
        {role === 'exporter' && (
          <g filter="url(#whiteStickerOutline)">
            {/* Cargo Box (ตู้คอนเทนเนอร์หลังรถ) */}
            <rect x="10" y="20" width="28" height="22" rx="3" fill="url(#orange25DMain)" />
            {/* Container Ribs */}
            <line x1="16" y1="23" x2="16" y2="39" stroke="#FFF" strokeWidth="1" opacity="0.6" />
            <line x1="22" y1="23" x2="22" y2="39" stroke="#FFF" strokeWidth="1" opacity="0.6" />
            <line x1="28" y1="23" x2="28" y2="39" stroke="#FFF" strokeWidth="1" opacity="0.6" />
            <line x1="34" y1="23" x2="34" y2="39" stroke="#FFF" strokeWidth="1" opacity="0.6" />
            {/* Truck Cab (หน้ารถบรรทุก) */}
            <path d="M38 28 L46 28 L53 35 L53 42 L38 42 Z" fill="url(#orange25DDark)" />
            {/* Windshield Glass */}
            <polygon points="41,30 46,30 51,35 41,35" fill="#FFF" opacity="0.85" />
            {/* Headlight */}
            <circle cx="51.5" cy="39" r="1.5" fill="#FFE5A3" />
            {/* Bumper */}
            <rect x="52" y="40" width="3" height="3" rx="1" fill="#501A00" />
            {/* Wheels & Tires */}
            <circle cx="18" cy="44" r="5.5" fill="#3D1800" />
            <circle cx="18" cy="44" r="2.5" fill="#FFA64D" />
            <circle cx="31" cy="44" r="5.5" fill="#3D1800" />
            <circle cx="31" cy="44" r="2.5" fill="#FFA64D" />
            <circle cx="47" cy="44" r="5.5" fill="#3D1800" />
            <circle cx="47" cy="44" r="2.5" fill="#FFA64D" />
          </g>
        )}

        {/* 6. AUDITOR: Clipboard + Magnifying Glass (คลิปบอร์ด + แว่นขยาย) */}
        {role === 'auditor' && (
          <g filter="url(#whiteStickerOutline)">
            {/* Clipboard Board */}
            <rect x="14" y="14" width="28" height="36" rx="4" fill="url(#orange25DMain)" />
            {/* Clipboard Metal Clip */}
            <rect x="22" y="11" width="12" height="6" rx="2" fill="#E25800" />
            <circle cx="28" cy="13" r="1.2" fill="#FFF" />
            {/* Paper Sheet */}
            <rect x="18" y="18" width="20" height="28" rx="2" fill="#FFFDF8" />
            {/* Checklist lines */}
            <line x1="22" y1="24" x2="34" y2="24" stroke="#FFA64D" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="22" y1="29" x2="34" y2="29" stroke="#FFA64D" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="22" y1="34" x2="30" y2="34" stroke="#FFA64D" strokeWidth="1.5" strokeLinecap="round" />
            {/* Greenish checkmarks */}
            <circle cx="20" cy="24" r="1.5" fill="#FF7A1A" />
            <circle cx="20" cy="29" r="1.5" fill="#FF7A1A" />
            {/* 2.5D Magnifying Glass on top */}
            <g transform="translate(18, 14)">
              {/* Glass Rim */}
              <circle cx="20" cy="20" r="10" fill="#FFA64D" fillOpacity="0.3" stroke="url(#orange25DDark)" strokeWidth="3" />
              {/* Glass Glare */}
              <path d="M14 16 A 7 7 0 0 1 24 14" stroke="#FFF" strokeWidth="1.5" strokeLinecap="round" />
              {/* Handle */}
              <rect x="26" y="26" width="12" height="4.5" rx="2" transform="rotate(45 26 26)" fill="url(#orange25DDark)" />
            </g>
          </g>
        )}

        {/* 7. ADMIN: Cog Gear + Operator with Headset (ฟันเฟือง + คนใส่หูฟัง) */}
        {(role === 'admin' || role === 'alert') && (
          <g filter="url(#whiteStickerOutline)">
            {/* Cog Gear Background (ฟันเฟือง 8 แฉก) */}
            <g transform="translate(32, 32)">
              <circle cx="0" cy="0" r="18" fill="url(#orange25DMain)" />
              {/* Cog Teeth */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                <rect
                  key={i}
                  x="-3.5"
                  y="-22"
                  width="7"
                  height="6"
                  rx="1.5"
                  fill="url(#orange25DMain)"
                  transform={`rotate(${deg})`}
                />
              ))}
              <circle cx="0" cy="0" r="12" fill="#FFFDF8" />
            </g>
            {/* Operator Head & Headset */}
            <circle cx="32" cy="28" r="6" fill="url(#orange25DDark)" />
            {/* Headset Arc */}
            <path d="M23 27 C23 21, 41 21, 41 27" stroke="#3D1800" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Headset Earcups */}
            <rect x="22" y="25" width="3" height="6" rx="1.5" fill="#FF7A1A" />
            <rect x="39" y="25" width="3" height="6" rx="1.5" fill="#FF7A1A" />
            {/* Microphone Boom */}
            <path d="M23 29 L28 33" stroke="#3D1800" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="28.5" cy="33.5" r="1.5" fill="#FFA64D" />
            {/* Operator Shoulders */}
            <path d="M23 41 C23 37, 41 37, 41 41 Z" fill="url(#orange25DDark)" />
          </g>
        )}

        {/* WATER DROPLET ICON (ค่าน้ำ) */}
        {role === 'water' && (
          <g filter="url(#whiteStickerOutline)">
            <path
              d="M32 10 C32 10, 16 30, 16 40 C16 49, 23 56, 32 56 C41 56, 48 49, 48 40 C48 30, 32 10, 32 10 Z"
              fill="url(#orange25DMain)"
            />
            {/* Highlight bubble */}
            <ellipse cx="26" cy="36" rx="4" ry="7" transform="rotate(-30 26 36)" fill="#FFF" opacity="0.6" />
          </g>
        )}

        {/* FEED BOWL ICON (อาหาร) */}
        {role === 'feed' && (
          <g filter="url(#whiteStickerOutline)">
            <ellipse cx="32" cy="28" rx="20" ry="7" fill="url(#orange25DMain)" />
            <path d="M12 28 C12 40, 20 50, 32 50 C44 50, 52 40, 52 28 Z" fill="url(#orange25DDark)" />
            <ellipse cx="32" cy="28" rx="16" ry="5" fill="#FFF2E8" />
            {/* Pellets */}
            <circle cx="28" cy="28" r="2" fill="#E25800" />
            <circle cx="34" cy="27" r="2" fill="#E25800" />
            <circle cx="31" cy="30" r="1.8" fill="#B33E00" />
          </g>
        )}

        {/* POND ICON (บ่อกุ้ง) */}
        {role === 'pond' && (
          <g filter="url(#whiteStickerOutline)">
            <ellipse cx="32" cy="34" rx="22" ry="14" fill="url(#orange25DDark)" />
            <ellipse cx="32" cy="32" rx="18" ry="11" fill="url(#orange25DMain)" />
            <path d="M18 32 C22 35, 28 35, 32 32 C36 29, 42 29, 46 32" stroke="#FFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
          </g>
        )}

        {/* TRACE ICON (ตรวจสอบย้อนกลับ) */}
        {role === 'trace' && (
          <g filter="url(#whiteStickerOutline)">
            <circle cx="20" cy="32" r="8" fill="url(#orange25DMain)" />
            <circle cx="44" cy="32" r="8" fill="url(#orange25DDark)" />
            <path d="M26 32 L38 32" stroke="url(#orange25DMain)" strokeWidth="4" strokeLinecap="round" />
            <path d="M34 26 L40 32 L34 38" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}
      </svg>
    </div>
  );
};
