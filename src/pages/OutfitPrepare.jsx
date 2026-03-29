import React, { useState, useEffect } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

// -----------------------------------------------------------
// 📦 1. 드롭 가능한 '날짜(Day)' 컨테이너
// -----------------------------------------------------------
function DroppableDay({ day, dateLabel, children, addOutfitSlot }) {
  const { setNodeRef, isOver } = useDroppable({ id: day });

  return (
    <div ref={setNodeRef} className={`rounded-3xl p-4 md:p-5 border shadow-sm transition-colors ${isOver ? 'bg-sky-100 border-sky-300 ring-2 ring-sky-200' : 'bg-sky-50/30 border-sky-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-black text-sky-800 flex items-end gap-2 pointer-events-none">
          Day {dateLabel.split(' ')[0]} <span className="text-xs md:text-sm font-bold text-slate-500 pb-0.5">({dateLabel.split(' ')[1]})</span>
        </h3>
        <button onClick={() => addOutfitSlot(day)} className="text-xs font-bold bg-white border border-sky-200 text-sky-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-sky-50 transition-colors z-10 relative">
          + 코디 추가
        </button>
      </div>
      <div className="space-y-3">
        {children}
        {React.Children.count(children) === 0 && (
           <div className="text-center py-6 text-sky-300 font-bold text-sm border-2 border-dashed border-sky-200 rounded-2xl">
             여기로 코디를 드래그해서 복사해보세요!
           </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// 👕 2. 드래그 가능한 '개별 코디' 카드
// -----------------------------------------------------------
function DraggableOutfitItem({ day, item, updateOutfit, removeOutfitSlot, isOverlay = false }) {
  const draggable = useDraggable(isOverlay ? { id: 'overlay' } : { id: item.id, data: { item, sourceDay: day } });
  const { attributes, listeners, setNodeRef, isDragging } = draggable;

  return (
    <div ref={!isOverlay ? setNodeRef : null} className={`bg-white border border-slate-200 rounded-xl p-2 md:p-3 shadow-sm flex flex-col xl:flex-row items-start xl:items-center gap-3 relative ${isDragging ? 'opacity-40 scale-95' : ''} ${isOverlay ? 'shadow-xl ring-2 ring-sky-400 rotate-2' : ''}`}>
      
      {/* 왼쪽: 드래그 핸들 & 1-버튼 토글 그룹 */}
      <div className="flex items-center gap-2 w-full xl:w-auto shrink-0 border-b xl:border-b-0 border-slate-100 pb-2 xl:pb-0">
        <div {...(!isOverlay ? listeners : {})} {...(!isOverlay ? attributes : {})} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-sky-500 touch-none px-1">
          <span className="text-lg">⋮⋮</span>
        </div>
        
        {/* 신부/신랑 토글 */}
        <button 
          onClick={() => !isOverlay && updateOutfit(day, item.id, 'owner', item.owner === '신부' ? '신랑' : '신부')} 
          className={`shrink-0 w-[46px] py-1.5 rounded-lg text-[11px] font-black border transition-colors shadow-sm flex items-center justify-center ${item.owner === '신부' ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}
        >
          {item.owner || '신부'}
        </button>

        {/* 투피스/원피스 토글 */}
        <button 
          onClick={() => !isOverlay && updateOutfit(day, item.id, 'isOnePiece', !item.isOnePiece)} 
          className="shrink-0 w-[52px] py-1.5 rounded-lg text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center"
        >
          {item.isOnePiece ? '원피스' : '투피스'}
        </button>

        {/* 모바일 삭제 버튼 */}
        <button onClick={() => !isOverlay && removeOutfitSlot(day, item.id)} className="xl:hidden ml-auto text-slate-300 hover:text-red-500 font-black text-sm px-2">✕</button>
      </div>

      {/* 오른쪽: 입력칸 가로 스크롤/나열 */}
      <div className="flex overflow-x-auto custom-scrollbar xl:overflow-visible flex-1 gap-2 w-full min-w-0 items-center pb-1 xl:pb-0">
        <input 
          type="text" 
          value={item.top} 
          onChange={(e) => !isOverlay && updateOutfit(day, item.id, 'top', e.target.value)} 
          placeholder={item.isOnePiece ? "원피스" : "상의"} 
          className="flex-1 min-w-[80px] text-[13px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-400 focus:bg-white" 
        />
        {!item.isOnePiece && (
          <input 
            type="text" 
            value={item.bottom} 
            onChange={(e) => !isOverlay && updateOutfit(day, item.id, 'bottom', e.target.value)} 
            placeholder="하의" 
            className="flex-1 min-w-[80px] text-[13px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-400 focus:bg-white" 
          />
        )}
        <input 
          type="text" 
          value={item.outer} 
          onChange={(e) => !isOverlay && updateOutfit(day, item.id, 'outer', e.target.value)} 
          placeholder="아우터" 
          className="flex-1 min-w-[80px] text-[13px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-400 focus:bg-white" 
        />
        <input 
          type="text" 
          value={item.shoes} 
          onChange={(e) => !isOverlay && updateOutfit(day, item.id, 'shoes', e.target.value)} 
          placeholder="신발" 
          className="flex-1 min-w-[80px] text-[13px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-400 focus:bg-white" 
        />
        <input 
          type="text" 
          value={item.acc} 
          onChange={(e) => !isOverlay && updateOutfit(day, item.id, 'acc', e.target.value)} 
          placeholder="액세서리" 
          className="flex-1 min-w-[80px] text-[13px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-sky-400 focus:bg-white" 
        />
        
        {/* PC 삭제 버튼 */}
        <button onClick={() => !isOverlay && removeOutfitSlot(day, item.id)} className="hidden xl:block text-slate-300 hover:text-red-500 font-black text-sm px-2 shrink-0">✕</button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// 🌟 메인 컴포넌트
// -----------------------------------------------------------
export default function OutfitPrepare({ timeline }) {
  const availableDays = Object.keys(timeline || {}).filter(day => timeline[day].length > 0).sort();
  const [viewMode, setViewMode] = useState('날짜별');
  const [activeDragItem, setActiveDragItem] = useState(null);

  const [outfits, setOutfits] = useState(() => {
    const saved = localStorage.getItem('dugeun_outfits');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('dugeun_outfits', JSON.stringify(outfits));
  }, [outfits]);

  useEffect(() => {
    if (availableDays.length > 0) {
      setOutfits(prev => {
        let updated = { ...prev };
        let changed = false;
        availableDays.forEach(day => {
          if (!updated[day] || updated[day].length === 0) {
            updated[day] = [{ id: `outfit_${Date.now()}_${Math.random()}`, owner: '신부', isOnePiece: false, top: '', bottom: '', outer: '', shoes: '', acc: '' }];
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [timeline]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event) => setActiveDragItem(event.active.data.current);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragItem(null);

    if (over && over.id) {
      const sourceItem = active.data.current.item;
      const targetDay = over.id;
      const clonedItem = { ...sourceItem, id: `outfit_copy_${Date.now()}_${Math.random()}` };

      setOutfits(prev => ({
        ...prev,
        [targetDay]: [...(prev[targetDay] || []), clonedItem]
      }));
    }
  };

  const addOutfitSlot = (day) => {
    setOutfits(prev => ({
      ...prev,
      [day]: [...(prev[day] || []), { id: `outfit_${Date.now()}`, owner: '신부', isOnePiece: false, top: '', bottom: '', outer: '', shoes: '', acc: '' }]
    }));
  };

  const removeOutfitSlot = (day, id) => { setOutfits(prev => ({ ...prev, [day]: prev[day].filter(item => item.id !== id) })); };

  const updateOutfit = (day, id, field, value) => {
    setOutfits(prev => ({
      ...prev,
      [day]: prev[day].map(item => {
        if (item.id === id) {
          if (field === 'isOnePiece' && value === true) return { ...item, [field]: value, bottom: '' };
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  // ⭐️ 요약본 필터링 (X, x 무시)
  const getSummary = () => {
    const initSet = () => ({ tops: new Set(), bottoms: new Set(), onepieces: new Set(), outers: new Set(), shoes: new Set(), accs: new Set() });
    const data = { '신부': initSet(), '신랑': initSet() };

    // 값이 비어있거나 'X', 'x'인 경우 필터링하는 함수
    const isValid = (val) => {
      if (!val) return false;
      const trimmed = val.trim();
      return trimmed !== '' && trimmed.toLowerCase() !== 'x';
    };

    Object.values(outfits).flat().forEach(item => {
      const owner = item.owner || '신부';
      const cat = data[owner];

      if (item.isOnePiece) {
        if (isValid(item.top)) cat.onepieces.add(item.top.trim());
      } else {
        if (isValid(item.top)) cat.tops.add(item.top.trim());
        if (isValid(item.bottom)) cat.bottoms.add(item.bottom.trim());
      }
      if (isValid(item.outer)) cat.outers.add(item.outer.trim());
      if (isValid(item.shoes)) cat.shoes.add(item.shoes.trim());
      if (isValid(item.acc)) cat.accs.add(item.acc.trim());
    });

    return {
      '신부': { tops: [...data['신부'].tops], bottoms: [...data['신부'].bottoms], onepieces: [...data['신부'].onepieces], outers: [...data['신부'].outers], shoes: [...data['신부'].shoes], accs: [...data['신부'].accs] },
      '신랑': { tops: [...data['신랑'].tops], bottoms: [...data['신랑'].bottoms], onepieces: [...data['신랑'].onepieces], outers: [...data['신랑'].outers], shoes: [...data['신랑'].shoes], accs: [...data['신랑'].accs] }
    };
  };

  if (availableDays.length === 0) {
    return (
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-sky-100 min-h-[500px] flex flex-col items-center justify-center text-slate-400 italic space-y-4">
        <span className="text-6xl">👗</span>
        <p className="text-lg font-bold">아직 정리된 일정이 없어요.</p>
        <p className="text-sm">[여행 일정]에서 여행 날짜를 먼저 만들어주세요!</p>
      </div>
    );
  }

  const summary = getSummary();
  const Pill = ({ text, color }) => (
    <span className={`px-3 py-1.5 bg-white border ${color} rounded-full text-[12px] font-black shadow-sm flex items-center gap-1.5`}>
      <div className={`w-1.5 h-1.5 rounded-full ${color.replace('border-', 'bg-').replace('text-', 'bg-')}`}></div>
      {text}
    </span>
  );

  return (
    <div className="flex flex-col gap-6 pb-20">
      
      {/* 탭 전환 */}
      <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-sky-100 flex items-center justify-center sticky top-[120px] md:top-[136px] z-30">
        <div className="bg-sky-50 p-1 rounded-full flex gap-1 border border-sky-100 shadow-inner">
          <button onClick={() => setViewMode('날짜별')} className={`px-6 md:px-8 py-2 rounded-full font-bold text-xs md:text-sm transition-all ${viewMode === '날짜별' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-400 hover:text-sky-600'}`}>날짜별 코디</button>
          <button onClick={() => setViewMode('요약')} className={`px-6 md:px-8 py-2 rounded-full font-bold text-xs md:text-sm transition-all ${viewMode === '요약' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}>캐리어 요약본</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-sky-100 p-4 md:p-8 min-h-[400px] md:min-h-[600px] max-w-4xl mx-auto w-full">
        
        {viewMode === '날짜별' && (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col gap-6">
              <div className="bg-sky-50 text-sky-700 border border-sky-200 p-3 rounded-xl text-center text-xs md:text-sm font-bold shadow-sm flex items-center justify-center gap-2">
                <span>💡</span>
                <p>핸들(⋮⋮)을 다른 날짜에 드래그하면 <span className="bg-white px-2 py-0.5 rounded text-sky-600 border border-sky-200">복사</span>됩니다!</p>
              </div>

              {availableDays.map((day, idx) => {
                const formattedDate = new Date(day).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
                return (
                  <DroppableDay key={day} day={day} dateLabel={`${idx + 1} ${formattedDate}`} addOutfitSlot={addOutfitSlot}>
                    {(outfits[day] || []).map((item) => (
                      <DraggableOutfitItem key={item.id} day={day} item={item} updateOutfit={updateOutfit} removeOutfitSlot={removeOutfitSlot} />
                    ))}
                  </DroppableDay>
                );
              })}
            </div>

            <DragOverlay>
              {activeDragItem ? (
                <div className="w-[320px] xl:w-[800px]">
                  <DraggableOutfitItem day={activeDragItem.sourceDay} item={activeDragItem.item} isOverlay={true} />
                </div>
              ) : null}
            </DragOverlay>

          </DndContext>
        )}

        {viewMode === '요약' && (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 pt-4">
              
              {/* 👰‍♀️ 신부 캐리어 (높이 동기화 flex-1) */}
              <div className="relative pt-6 flex flex-col h-full">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-8 border-[6px] border-rose-200 rounded-t-2xl border-b-0 z-0"></div>
                
                {/* ⭐️ flex-1을 추가해서 높이가 항상 아래까지 늘어나게 만듦 */}
                <div className="bg-rose-50/40 border-4 border-rose-200 rounded-[2rem] p-5 md:p-6 shadow-md flex flex-col flex-1 gap-5 relative z-10 overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-8 w-px border-l-2 border-dashed border-rose-200/50"></div>
                  <div className="absolute top-0 bottom-0 right-8 w-px border-r-2 border-dashed border-rose-200/50"></div>

                  {/* ⭐️ py-3 적용으로 텍스트 완벽 수직/수평 중앙 정렬 */}
                  <h3 className="text-lg md:text-xl font-black text-rose-600 flex items-center justify-center border-b-2 border-rose-100 py-3 relative z-10 bg-rose-50/80 mx-4 rounded-xl">
                    신부 캐리어
                  </h3>
                  
                  <div className="space-y-4 relative z-10 pb-4">
                    <div>
                      <h4 className="text-xs font-black text-rose-400 mb-2">상의 ({summary['신부'].tops.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신부'].tops.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신부'].tops.map((t, i) => <Pill key={i} text={t} color="text-rose-600 border-rose-100" />)}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-400 mb-2">하의 ({summary['신부'].bottoms.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신부'].bottoms.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신부'].bottoms.map((t, i) => <Pill key={i} text={t} color="text-rose-600 border-rose-100" />)}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-400 mb-2">원피스 ({summary['신부'].onepieces.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신부'].onepieces.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신부'].onepieces.map((t, i) => <Pill key={i} text={t} color="text-rose-600 border-rose-100" />)}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-400 mb-2">아우터 ({summary['신부'].outers.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신부'].outers.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신부'].outers.map((t, i) => <Pill key={i} text={t} color="text-rose-600 border-rose-100" />)}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-400 mb-2">신발 ({summary['신부'].shoes.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신부'].shoes.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신부'].shoes.map((t, i) => <Pill key={i} text={t} color="text-rose-600 border-rose-100" />)}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-rose-400 mb-2">액세서리 ({summary['신부'].accs.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신부'].accs.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신부'].accs.map((t, i) => <Pill key={i} text={t} color="text-rose-600 border-rose-100" />)}</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-12 w-6 h-4 bg-slate-400 rounded-b-xl z-0"></div>
                <div className="absolute -bottom-2 right-12 w-6 h-4 bg-slate-400 rounded-b-xl z-0"></div>
              </div>

              {/* 🤵‍♂️ 신랑 캐리어 (높이 동기화 flex-1) */}
              <div className="relative pt-6 flex flex-col h-full">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-8 border-[6px] border-indigo-200 rounded-t-2xl border-b-0 z-0"></div>
                
                {/* ⭐️ flex-1을 추가해서 높이가 항상 아래까지 늘어나게 만듦 */}
                <div className="bg-indigo-50/40 border-4 border-indigo-200 rounded-[2rem] p-5 md:p-6 shadow-md flex flex-col flex-1 gap-5 relative z-10 overflow-hidden">
                  <div className="absolute top-0 bottom-0 left-8 w-px border-l-2 border-dashed border-indigo-200/50"></div>
                  <div className="absolute top-0 bottom-0 right-8 w-px border-r-2 border-dashed border-indigo-200/50"></div>

                  {/* ⭐️ py-3 적용으로 텍스트 완벽 수직/수평 중앙 정렬 */}
                  <h3 className="text-lg md:text-xl font-black text-indigo-600 flex items-center justify-center border-b-2 border-indigo-100 py-3 relative z-10 bg-indigo-50/80 mx-4 rounded-xl">
                    신랑 캐리어
                  </h3>
                  
                  <div className="space-y-4 relative z-10 pb-4">
                    <div>
                      <h4 className="text-xs font-black text-indigo-400 mb-2">상의 ({summary['신랑'].tops.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신랑'].tops.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신랑'].tops.map((t, i) => <Pill key={i} text={t} color="text-indigo-600 border-indigo-100" />)}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-400 mb-2">하의 ({summary['신랑'].bottoms.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신랑'].bottoms.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신랑'].bottoms.map((t, i) => <Pill key={i} text={t} color="text-indigo-600 border-indigo-100" />)}</div>
                    </div>
                    <div className="hidden md:block py-3"></div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-400 mb-2">아우터 ({summary['신랑'].outers.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신랑'].outers.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신랑'].outers.map((t, i) => <Pill key={i} text={t} color="text-indigo-600 border-indigo-100" />)}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-400 mb-2">신발 ({summary['신랑'].shoes.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신랑'].shoes.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신랑'].shoes.map((t, i) => <Pill key={i} text={t} color="text-indigo-600 border-indigo-100" />)}</div>
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-indigo-400 mb-2">액세서리 ({summary['신랑'].accs.length})</h4>
                      <div className="flex flex-wrap gap-2">{summary['신랑'].accs.length === 0 ? <span className="text-xs text-slate-300">없음</span> : summary['신랑'].accs.map((t, i) => <Pill key={i} text={t} color="text-indigo-600 border-indigo-100" />)}</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-12 w-6 h-4 bg-slate-400 rounded-b-xl z-0"></div>
                <div className="absolute -bottom-2 right-12 w-6 h-4 bg-slate-400 rounded-b-xl z-0"></div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}