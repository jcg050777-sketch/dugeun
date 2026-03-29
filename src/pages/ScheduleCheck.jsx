import React, { useState } from 'react';

const parseSafeTimeData = (timeData) => {
  if (!timeData) return { h: 0, m: 0, str: 'AM 12:00' };
  
  if (typeof timeData === 'object') {
    let h = parseInt(timeData.hour) || 0;
    const m = parseInt(timeData.minute || timeData.min) || 0;
    const ampm = timeData.ampm || 'AM';
    const str = `${ampm} ${String(timeData.hour || 12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h, m, str };
  }
  
  if (typeof timeData === 'string') {
    const [ampm, rest] = timeData.split(' ');
    if (!rest || !rest.includes(':')) return { h: 0, m: 0, str: 'AM 12:00' };
    const [hourStr, minStr] = rest.split(':');
    let h = parseInt(hourStr) || 0;
    const m = parseInt(minStr) || 0;
    
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h, m, str: timeData };
  }
  
  return { h: 0, m: 0, str: 'AM 12:00' };
};

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return { x: centerX + radius * Math.cos(angleInRadians), y: centerY + radius * Math.sin(angleInRadians) };
};

const describeSector = (x, y, radius, startAngle, endAngle) => {
  if (isNaN(startAngle) || isNaN(endAngle) || startAngle === endAngle) return "";
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", x, y, "L", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" ");
};

// ⭐️ 커스텀 테마 색상 리스트 추가
const THEMES_CHECK = {
  red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', hex: '#ef4444' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', hex: '#f97316' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', hex: '#f59e0b' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', hex: '#10b981' },
  sky: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', hex: '#0ea5e9' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', hex: '#6366f1' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', hex: '#a855f7' },
  fuchsia: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200', hex: '#d946ef' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', hex: '#f43f5e' },
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', hex: '#64748b' }
};

// ⭐️ categories props 추가 받기
export default function ScheduleCheck({ timeline, categories }) {
  const safeTimeline = timeline || {};
  const availableDays = Object.keys(safeTimeline).filter(day => Array.isArray(safeTimeline[day]) && safeTimeline[day].length > 0).sort();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [viewMode, setViewMode] = useState('일반');

  const currentDayStr = availableDays[currentDayIndex];
  const currentItems = currentDayStr ? safeTimeline[currentDayStr] : [];

  let currentRefH = 9;
  let currentRefM = 0;

  // ⭐️ 다이내믹 컬러 추출 함수 추가
  const getDynamicColorCheck = (categoryName) => {
    const cat = (categories || []).find(c => c.name === categoryName);
    const colorKey = cat ? cat.color : 'fuchsia';
    return THEMES_CHECK[colorKey] || THEMES_CHECK.fuchsia;
  };

  const computedItems = currentItems.map((item) => {
    let startH, startM, endH, endM;

    if (item.inputType === '시간') {
        startH = currentRefH;
        startM = currentRefM;
        const durMins = parseFloat(item.duration || 1) * 60;
        const totalMins = startH * 60 + startM + durMins;
        endH = Math.floor(totalMins / 60) % 24;
        endM = totalMins % 60;
    } else {
        const s = parseSafeTimeData(item.startTime);
        const e = parseSafeTimeData(item.endTime);
        startH = s.h; startM = s.m;
        endH = e.h; endM = e.m;
    }

    currentRefH = endH;
    currentRefM = endM;

    const formatTimeStr = (h, m) => {
      const ampm = h >= 12 ? 'PM' : 'AM';
      let hh = h % 12;
      if (hh === 0) hh = 12;
      return `${ampm} ${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    
    const startTotalMins = startH * 60 + startM;
    let endTotalMins = endH * 60 + endM;
    if (endTotalMins < startTotalMins) endTotalMins += 1440; 

    const durMins = endTotalMins - startTotalMins;
    const durHrs = Math.floor(durMins / 60);
    const durRemMins = durMins % 60;
    let computedDurationStr = durRemMins === 0 ? `${durHrs}시간` : `${durHrs}시간 ${durRemMins}분`;
    if (durHrs === 0) computedDurationStr = `${durRemMins}분`;

    // ⭐️ 여기서 카테고리 색상을 동적으로 불러옴!
    const theme = getDynamicColorCheck(item.category);

    return {
      ...item,
      colorHex: theme.hex,
      colorClass: `${theme.bg} ${theme.text} ${theme.border}`,
      computedStartStr: formatTimeStr(startH, startM),
      computedEndStr: formatTimeStr(endH, endM),
      computedDurationStr,
      startTotalMins,
      endTotalMins
    };
  });

  if (availableDays.length === 0) {
    return (
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-sky-100 min-h-[500px] flex flex-col items-center justify-center text-slate-400 italic space-y-4">
        <span className="text-6xl">🗓️</span>
        <p className="text-lg font-bold">아직 정리된 일정이 없어요.</p>
        <p className="text-sm">[일정 정리] 탭에서 타임라인에 일정을 먼저 추가해주세요!</p>
      </div>
    );
  }

  const formattedDate = new Date(currentDayStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-sky-100 flex items-center justify-between sticky top-[136px] z-30">
        <button onClick={() => setCurrentDayIndex(prev => prev - 1)} disabled={currentDayIndex === 0} className={`px-4 py-2 rounded-xl font-black text-lg transition-colors ${currentDayIndex === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-sky-600 hover:bg-sky-50'}`}>◀ 이전</button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-sky-700">Day {currentDayIndex + 1}</h2>
          <p className="text-sm font-bold text-slate-400">{formattedDate}</p>
        </div>
        <button onClick={() => setCurrentDayIndex(prev => prev + 1)} disabled={currentDayIndex === availableDays.length - 1} className={`px-4 py-2 rounded-xl font-black text-lg transition-colors ${currentDayIndex === availableDays.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-sky-600 hover:bg-sky-50'}`}>다음 ▶</button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-sky-100 min-h-[600px] flex flex-col p-8 relative z-10">
        <div className="flex justify-center mb-10">
          <div className="bg-sky-50 p-1 rounded-full flex gap-1 border border-sky-100 shadow-inner">
            <button onClick={() => setViewMode('일반')} className={`px-8 py-2 rounded-full font-bold text-sm transition-all ${viewMode === '일반' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-400 hover:text-sky-600'}`}>일반 모드</button>
            <button onClick={() => setViewMode('원형')} className={`px-8 py-2 rounded-full font-bold text-sm transition-all ${viewMode === '원형' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-400 hover:text-sky-600'}`}>원형 모드</button>
          </div>
        </div>

        {viewMode === '일반' && (
          <div className="max-w-4xl mx-auto w-full space-y-3">
            {computedItems.length === 0 ? (
              <p className="text-center text-slate-400 py-20">이 날짜에 등록된 일정이 없습니다.</p>
            ) : (
              computedItems.map((item, idx) => (
                <div key={item.id} className="flex gap-2 sm:gap-4 items-start">
                  
                  <div className="flex flex-col items-center relative w-4 sm:w-6 mt-3 sm:mt-5 shrink-0">
                    {idx !== computedItems.length - 1 && <div className="absolute top-4 w-0.5 h-[calc(100%+12px)] bg-slate-200"></div>}
                    <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-[3px] border-sky-400 bg-white z-10"></div>
                  </div>
                  
                  <div className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:p-4 flex flex-col hover:border-sky-300 shadow-sm gap-2 sm:gap-3 mb-2">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      
                      <div className="w-full sm:w-[280px] shrink-0 flex items-center justify-between bg-white py-1.5 sm:py-2 px-3 rounded-xl border border-sky-100 shadow-sm whitespace-nowrap">
                        <span className="text-[13px] sm:text-[15px] font-black text-sky-800 tracking-tight whitespace-nowrap">
                          {item.computedStartStr} <span className="text-sky-300 font-bold mx-0.5 sm:mx-1">~</span> {item.computedEndStr}
                        </span>
                        <span className="text-[10px] sm:text-[12px] font-bold text-sky-500 whitespace-nowrap shrink-0 ml-1 sm:ml-2">
                          ({item.computedDurationStr})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                        {/* ⭐️ 동적 색상 클래스 적용! */}
                        <div className={`shrink-0 sm:w-[80px] text-center text-[10px] sm:text-[12px] font-black px-2 py-1 sm:py-1.5 rounded-lg border ${item.colorClass}`}>
                          {item.category}
                        </div>

                        <div className="flex-1 min-w-0 sm:border-l-2 sm:border-slate-200 sm:pl-4 sm:py-1 flex items-center gap-1.5 sm:gap-2.5">
                          <h4 className="font-bold text-slate-800 text-[14px] sm:text-[17px] truncate">{item.alias || '이름 없음'}</h4>
                          
                          {item.memo && (
                            <span className="text-[11px] sm:text-[14px] italic font-black text-rose-500 truncate flex items-center gap-1">
                              <span className="text-[10px] sm:text-[13px] drop-shadow-sm">📌</span> {item.memo}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {viewMode === '원형' && (
          <div className="flex items-center justify-center py-6">
            <div className="relative w-[500px] h-[500px]">
              <div className="absolute inset-0 rounded-full border-[16px] border-slate-50 shadow-inner bg-white"></div>
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 z-20">00:00</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400 z-20">12:00</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 z-20">06:00</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 z-20">18:00</span>

              <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
                {computedItems.map((item) => {
                  const startAngle = (item.startTotalMins / 1440) * 360;
                  const endAngle = (item.endTotalMins / 1440) * 360;
                  const adjustedEndAngle = endAngle < startAngle ? endAngle + 360 : endAngle;
                  const midAngle = (startAngle + adjustedEndAngle) / 2;
                  const textPos = polarToCartesian(100, 100, 68, midAngle);
                  const showText = (adjustedEndAngle - startAngle) > 7.5;

                  return (
                    <g key={item.id}>
                      {/* ⭐️ 동적 색상 hex 코드 적용! */}
                      <path d={describeSector(100, 100, 100, startAngle, adjustedEndAngle)} fill={item.colorHex} opacity="0.85" stroke="white" strokeWidth="1.5" className="hover:opacity-100 transition-opacity cursor-pointer">
                        <title>{item.alias} ({item.computedStartStr} ~ {item.computedEndStr})</title>
                      </path>
                      {showText && (
                        <>
                          <text x={textPos.x} y={textPos.y - 3} fill="white" fontSize="4.5" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>{item.alias || '이름 없음'}</text>
                          <text x={textPos.x} y={textPos.y + 3} fill="rgba(255,255,255,0.9)" fontSize="3.5" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>{item.computedStartStr} ~ {item.computedEndStr}</text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
              <div className="absolute inset-[25%] rounded-full bg-white shadow-md flex items-center justify-center flex-col z-20 border-8 border-slate-50">
                <span className="text-sm font-bold text-slate-400">Day {currentDayIndex + 1}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}