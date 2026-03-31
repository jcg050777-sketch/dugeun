import React from 'react';

// 시간 파싱 함수
const parseSafeTimeData = (timeData) => {
  if (!timeData) return 'AM 12:00';
  if (typeof timeData === 'object') {
    const h = String(timeData.hour || 12).padStart(2, '0');
    const m = String(timeData.minute || timeData.min || 0).padStart(2, '0');
    return `${timeData.ampm || 'AM'} ${h}:${m}`;
  }
  if (typeof timeData === 'string') return timeData;
  return 'AM 12:00';
};

export default function TravelReport({ timeline }) {
  const safeTimeline = timeline || {};
  const availableDays = Object.keys(safeTimeline).filter(day => Array.isArray(safeTimeline[day]) && safeTimeline[day].length > 0).sort();
  
  let outfits = {};
  try {
    outfits = JSON.parse(localStorage.getItem('dugeun_outfits') || '{}');
  } catch (e) {
    console.error("데이터 에러:", e);
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 pb-20 print:pb-0 font-sans relative">
      
      {/* ⭐️ 인쇄 시 Dugeun 헤더가 제목을 가리는 현상 완벽 차단! */}
      <style>
        {`
          @media print {
            header { display: none !important; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        `}
      </style>

      {/* 화면용 컨트롤러 (인쇄 시 숨김) */}
      <div className="bg-white p-6 rounded-none sm:rounded-2xl border border-sky-100 flex flex-col sm:flex-row items-center justify-between sticky top-[100px] md:top-[136px] z-30 print:hidden shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-sky-800">요약 리포트 미리보기</h2>
          <p className="text-sm text-sky-600 mt-1">일정과 복장 계획이 파란 테마의 깔끔한 리스트 형태로 출력됩니다.</p>
        </div>
        <button onClick={handlePrint} className="mt-4 sm:mt-0 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm transition-colors">
          PDF로 저장 / 인쇄하기
        </button>
      </div>

      {/* 인쇄 영역 */}
      <div className="bg-white border border-sky-100 p-8 md:p-12 print:p-0 print:border-none max-w-4xl mx-auto w-full">
        
        {/* 메인 타이틀 (이제 가려지지 않고 깔끔하게 나옵니다!) */}
        <div className="text-center mb-10 pb-6 border-b-[3px] border-sky-600 print:mt-4">
          <h1 className="text-3xl font-black text-sky-700 tracking-tight">여행 요약본</h1>
        </div>

        {/* 1. 일자별 세부 일정 */}
        <section className="mb-12 print:break-inside-avoid">
          <h2 className="text-xl font-black text-sky-800 mb-6 flex items-center gap-2 border-b-2 border-sky-100 pb-2">
            <span className="text-sm text-sky-500">■</span> 일자별 세부 일정
          </h2>
          
          {availableDays.length === 0 ? <p className="text-slate-400 text-sm">등록된 일정이 없습니다.</p> : (
            <div className="space-y-8">
              {availableDays.map((dayStr, idx) => {
                const dateLabel = new Date(dayStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
                return (
                  <div key={dayStr} className="print:break-inside-avoid">
                    <h3 className="text-base font-black text-sky-900 mb-2 bg-sky-50 px-4 py-2 rounded-lg inline-block shadow-sm">
                      Day {idx + 1} ({dateLabel})
                    </h3>
                    
                    <ul className="flex flex-col">
                      {safeTimeline[dayStr].map((item) => (
                        <li key={item.id} className="flex gap-4 items-center text-sm border-b border-sky-50 py-3 last:border-0 hover:bg-sky-50/30 transition-colors px-2 rounded-lg">
                          
                          <div className="font-black text-sky-600 w-[140px] shrink-0 tracking-tighter whitespace-nowrap">
                            {item.inputType === '시간' 
                              ? `${item.duration || 1}시간 소요` 
                              : `${parseSafeTimeData(item.startTime)} ~ ${parseSafeTimeData(item.endTime)}`}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 flex-1 min-w-0">
                            <span className="font-bold text-slate-800 text-base">{item.alias}</span>
                            <span className="text-[10px] font-bold text-sky-500 border border-sky-200 px-1.5 py-0.5 rounded bg-white shrink-0">
                              {item.category}
                            </span>
                            
                            {item.content && <span className="text-slate-600 text-[14px]">{item.content}</span>}
                            {item.memo && <span className="text-rose-500 font-bold text-[13px] shrink-0">📌 {item.memo}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 2. 일자별 복장 계획 (⭐️ print:break-before-page 적용하여 여기서부터 무조건 새 종이로 넘어감!) */}
        <section className="print:break-before-page print:pt-8">
          <h2 className="text-xl font-black text-sky-800 mb-6 flex items-center gap-2 border-b-2 border-sky-100 pb-2">
            <span className="text-sm text-sky-500">■</span> 일자별 복장 계획
          </h2>
          
          {availableDays.length === 0 ? <p className="text-slate-400 text-sm">등록된 일정이 없습니다.</p> : (
            <div className="space-y-8">
              {availableDays.map((dayStr, idx) => {
                const dateLabel = new Date(dayStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
                const dayOutfits = outfits[dayStr] || [];
                
                const hasOutfit = dayOutfits.some(o => (o.top && o.top.toLowerCase() !== 'x') || (o.bottom && o.bottom.toLowerCase() !== 'x') || (o.outer && o.outer.toLowerCase() !== 'x') || (o.shoes && o.shoes.toLowerCase() !== 'x') || (o.acc && o.acc.toLowerCase() !== 'x'));

                return (
                  <div key={`outfit-${dayStr}`} className="print:break-inside-avoid">
                    <h3 className="text-base font-black text-sky-900 mb-2 bg-sky-50 px-4 py-2 rounded-lg inline-block shadow-sm">
                      Day {idx + 1} ({dateLabel})
                    </h3>

                    {!hasOutfit ? (
                      <p className="text-sm text-slate-400 pl-4 py-2">등록된 코디가 없습니다.</p>
                    ) : (
                      <div className="flex flex-col gap-2 pl-2 mt-1">
                        {dayOutfits.map((item, oIdx) => {
                          if (!((item.top && item.top.toLowerCase() !== 'x') || (item.bottom && item.bottom.toLowerCase() !== 'x') || (item.outer && item.outer.toLowerCase() !== 'x') || (item.shoes && item.shoes.toLowerCase() !== 'x') || (item.acc && item.acc.toLowerCase() !== 'x'))) return null;
                          
                          const ownerColor = item.owner === '신부' ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-indigo-600 bg-indigo-50 border-indigo-200';

                          return (
                            <div key={item.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-slate-700 py-1.5 border-b border-sky-50 last:border-0 px-2 hover:bg-sky-50/30">
                              
                              <div className={`font-black px-2 py-0.5 rounded-md border text-[11px] shrink-0 mr-1 ${ownerColor}`}>
                                착장 {oIdx + 1} [{item.owner || '신부'}]
                              </div>
                              
                              {item.isOnePiece ? (
                                (item.top && item.top.toLowerCase() !== 'x') && <div><span className="font-black text-sky-400">원피스:</span> <span className="font-bold">{item.top}</span></div>
                              ) : (
                                <>
                                  {(item.top && item.top.toLowerCase() !== 'x') && <div><span className="font-black text-sky-400">상의:</span> <span className="font-bold">{item.top}</span></div>}
                                  {(item.bottom && item.bottom.toLowerCase() !== 'x') && <div><span className="font-black text-sky-400">하의:</span> <span className="font-bold">{item.bottom}</span></div>}
                                </>
                              )}
                              {(item.outer && item.outer.toLowerCase() !== 'x') && <div><span className="font-black text-sky-400">아우터:</span> <span className="font-bold">{item.outer}</span></div>}
                              {(item.shoes && item.shoes.toLowerCase() !== 'x') && <div><span className="font-black text-sky-400">신발:</span> <span className="font-bold">{item.shoes}</span></div>}
                              {(item.acc && item.acc.toLowerCase() !== 'x') && <div><span className="font-black text-sky-400">액세서리:</span> <span className="font-bold">{item.acc}</span></div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}