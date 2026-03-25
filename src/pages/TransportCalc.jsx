import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableTransportItem({ item, displayCurrency, exchangeRate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };
  
  const displayCost = displayCurrency === 'USD' ? item.transportCostUSD : item.transportCostUSD * exchangeRate;
  const costStr = displayCurrency === 'USD' ? `$${displayCost.toFixed(2)}` : `${Math.round(displayCost).toLocaleString()}원`;

  return (
    <div ref={setNodeRef} style={style} className={`p-3 bg-white border rounded-xl text-sm font-bold text-slate-700 cursor-grab hover:bg-indigo-50 shadow-sm flex items-center justify-between gap-2 relative group ${isDragging ? 'border-indigo-400 opacity-80 shadow-md scale-105' : 'border-indigo-100'}`}>
      <div className="flex items-center gap-2">
        <div {...attributes} {...listeners} className="text-indigo-300 hover:text-indigo-500 touch-none px-1">⋮⋮</div>
        <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded">교통</span>
        <span className="truncate max-w-[120px]">{item.alias}</span>
      </div>
      <div className="text-right shrink-0 bg-slate-50 px-2 py-1 rounded text-indigo-600 border border-slate-100">
        {costStr}
      </div>
    </div>
  );
}

function DroppableTransportColumn({ dayStr, dateLabel, items, activeCap, displayCurrency, exchangeRate }) {
  const { setNodeRef } = useDroppable({ id: dayStr });
  
  const daySum = items.reduce((sum, item) => sum + (displayCurrency === 'USD' ? item.transportCostUSD : item.transportCostUSD * exchangeRate), 0);
  const cappedSum = daySum > activeCap ? activeCap : daySum;
  const savedAmount = daySum - cappedSum;

  const formatCost = (val) => displayCurrency === 'USD' ? `$${val.toFixed(2)}` : `${Math.round(val).toLocaleString()}원`;

  return (
    <div ref={setNodeRef} className={`rounded-3xl p-5 border shadow-sm flex flex-col mb-6 transition-colors ${savedAmount > 0 ? 'bg-indigo-50/50 border-indigo-200' : 'bg-[#f8fbff] border-sky-100'}`}>
      <div className="flex justify-between items-start mb-4 border-b border-slate-200/50 pb-3">
        <div>
          <h4 className="font-black text-slate-700 text-lg flex items-center gap-2">
            Day <span className="text-xs font-bold text-slate-400 mt-1">{dateLabel}</span>
          </h4>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 mb-0.5">원래 요금: <span className="line-through">{formatCost(daySum)}</span></p>
          <p className="text-sm font-black text-indigo-700 flex items-center justify-end gap-1">
            상한 적용: {formatCost(cappedSum)}
          </p>
          {savedAmount > 0 && (
            <div className="mt-1 inline-block bg-green-100 text-green-700 text-[11px] px-2 py-0.5 rounded-full border border-green-200 font-black animate-pulse">
              🎉 {formatCost(savedAmount)} 세이브!
            </div>
          )}
        </div>
      </div>
      
      <SortableContext id={dayStr} items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[100px] bg-white/50 rounded-xl p-2 border border-dashed border-slate-200">
          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-300 font-bold py-8">여기로 교통수단을 끌어오세요</div>
          ) : (
            items.map(item => <SortableTransportItem key={item.id} item={item} displayCurrency={displayCurrency} exchangeRate={exchangeRate} />)
          )}
        </div>
      </SortableContext>
    </div>
  );
}

export default function TransportCalc({ timeline, exchangeRate }) {
  const safeRate = exchangeRate || 1400;
  const [localTimeline, setLocalTimeline] = useState({});
  const [activeId, setActiveId] = useState(null);
  
  const [displayCurrency, setDisplayCurrency] = useState('USD');
  
  const [dayCapsUSD, setDayCapsUSD] = useState({
    0: 8.90, 1: 17.80, 2: 17.80, 3: 17.80, 4: 17.80, 5: 17.80, 6: 8.90
  });

  const [selectedDays, setSelectedDays] = useState([]);
  const [ruleInput, setRuleInput] = useState(0);

  useEffect(() => {
    setRuleInput(displayCurrency === 'USD' ? 17.80 : Math.round(17.80 * safeRate));
  }, [displayCurrency, safeRate]);

  const initLocalTimeline = () => {
    const newLocal = {};
    Object.keys(timeline).forEach(day => {
      newLocal[day] = timeline[day]
        .filter(item => item.category === '교통')
        .map(item => {
          let costUSD = 0;
          if (item.expenses && item.expenses.length > 0) {
            item.expenses.forEach(ex => {
              const amt = parseFloat(ex.amount) || 0;
              costUSD += (ex.currency || 'USD') === 'USD' ? amt : amt / safeRate;
            });
          } else if (item.cost) {
            costUSD += parseFloat(item.cost) || 0;
          }
          return { ...item, id: `sim_${item.id}`, transportCostUSD: costUSD, originalDay: day };
        });
    });
    setLocalTimeline(newLocal);
  };

  useEffect(() => { initLocalTimeline(); }, [timeline, safeRate]);

  const availableDays = Object.keys(localTimeline).sort();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

  let totalOriginal = 0;
  let totalCapped = 0;
  Object.keys(localTimeline).forEach(dayStr => {
    const items = localTimeline[dayStr];
    const dayOfWeek = new Date(dayStr).getDay(); 
    const capUSD = dayCapsUSD[dayOfWeek] || 17.80;
    const activeCap = displayCurrency === 'USD' ? capUSD : capUSD * safeRate;

    const daySum = items.reduce((sum, item) => sum + (displayCurrency === 'USD' ? item.transportCostUSD : item.transportCostUSD * safeRate), 0);
    totalOriginal += daySum;
    totalCapped += (daySum > activeCap ? activeCap : daySum);
  });
  const totalSaved = totalOriginal - totalCapped;

  const handleDragStart = (event) => setActiveId(event.active.id);
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    let sourceContainer, targetContainer;
    for (const day of availableDays) {
      if (localTimeline[day]?.find(i => i.id === active.id)) sourceContainer = day;
      if (localTimeline[day]?.find(i => i.id === over.id) || day === over.id) targetContainer = day;
    }
    if (!sourceContainer || !targetContainer) return;

    setLocalTimeline(prev => {
      const sourceItems = [...prev[sourceContainer]];
      const targetItems = sourceContainer === targetContainer ? sourceItems : [...prev[targetContainer]];

      const sourceIndex = sourceItems.findIndex(i => i.id === active.id);
      const [movedItem] = sourceItems.splice(sourceIndex, 1);

      const targetIndex = targetItems.findIndex(i => i.id === over.id);
      if (targetIndex >= 0) targetItems.splice(targetIndex, 0, movedItem);
      else targetItems.push(movedItem);

      return { ...prev, [sourceContainer]: sourceItems, [targetContainer]: targetItems };
    });
  };

  const toggleDay = (dayIdx) => {
    setSelectedDays(prev => prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx]);
  };

  const applyRule = () => {
    if (selectedDays.length === 0) return alert('변경할 요일을 먼저 선택해주세요!');
    const valUSD = displayCurrency === 'USD' ? ruleInput : ruleInput / safeRate;
    setDayCapsUSD(prev => {
      const next = { ...prev };
      selectedDays.forEach(d => next[d] = valUSD);
      return next;
    });
    setSelectedDays([]);
  };

  const formatCost = (val) => displayCurrency === 'USD' ? `$${val.toFixed(2)}` : `${Math.round(val).toLocaleString()}원`;
  const activeItem = activeId ? Object.values(localTimeline).flat().find(p => p.id === activeId) : null;
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  if (availableDays.length === 0) {
    return (
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-sky-100 min-h-[500px] flex flex-col items-center justify-center text-slate-400 italic space-y-4">
        <span className="text-6xl">🚊</span>
        <p className="text-lg font-bold">교통수단 일정이 없어요.</p>
        <p className="text-sm">먼저 일정에 '교통' 항목과 비용을 추가해주세요!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 relative pb-24 max-w-5xl mx-auto w-full">
      
      <div className="bg-indigo-600 rounded-3xl p-5 md:px-8 md:py-6 shadow-lg text-white flex flex-col items-start gap-4 border-4 border-indigo-200">
        
        <div className="flex flex-col md:flex-row items-center justify-between w-full gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black mb-1 flex items-center gap-2"><span>🚃</span> 시드니 교통비 시뮬레이터</h2>
            <p className="text-indigo-200 text-xs md:text-sm font-bold">교통 일정을 이리저리 옮기면서 상한제(Cap) 혜택을 극대화해보세요!</p>
          </div>

          <div className="bg-white text-indigo-900 p-4 md:px-6 md:py-3 rounded-2xl shadow-inner min-w-[250px] text-center border-b-4 border-indigo-200">
            <p className="text-[10px] md:text-xs font-bold text-slate-400 mb-0.5">상한제 혜택으로 아낀 금액</p>
            <div className="text-2xl md:text-3xl font-black text-green-500 tracking-tighter mb-1">
              +{formatCost(totalSaved)}
            </div>
            <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1 mt-2 pt-2 border-t border-slate-100">
              <span>원래 요금: {formatCost(totalOriginal)}</span>
              <span>▶</span>
              <span className="text-indigo-600">적용 요금: {formatCost(totalCapped)}</span>
            </div>
          </div>
        </div>

        <div className="bg-indigo-800/60 p-4 rounded-xl w-full flex flex-col gap-3 border border-indigo-500/50 shadow-inner">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            
            <div className="flex items-center gap-2">
              {/* ⭐️ whitespace-nowrap 추가해서 글자 줄바꿈 절대 방지 */}
              <span className="text-xs font-bold text-indigo-300 shrink-0 whitespace-nowrap">요일 선택</span>
              <div className="flex gap-1 ml-1">
                {dayNames.map((d, i) => (
                  <button 
                    key={i} 
                    onClick={() => toggleDay(i)} 
                    className={`w-8 h-8 rounded-full text-xs font-black transition-all ${
                      selectedDays.includes(i) ? 'bg-emerald-400 text-indigo-900 shadow-[0_0_8px_rgba(52,211,153,0.5)] scale-110' : 'bg-indigo-900 text-indigo-300 hover:bg-indigo-700 border border-indigo-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-0 lg:ml-2">
              {/* ⭐️ 여기도 혹시 몰라 추가 */}
              <span className="text-xs font-bold text-indigo-300 shrink-0 whitespace-nowrap lg:hidden">상한선</span>
              <input 
                type="number" 
                value={ruleInput} 
                onChange={e => setRuleInput(Number(e.target.value))} 
                className="w-20 bg-indigo-900/50 border border-indigo-500 text-white font-black px-2 py-1.5 rounded-lg outline-none text-right text-sm focus:border-emerald-400 transition-colors" 
              />
              <span className="text-xs font-bold text-indigo-300">{displayCurrency === 'USD' ? '$' : '원'}</span>
              
              <button 
                onClick={applyRule} 
                className="ml-1 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-indigo-400 transition-colors active:scale-95 whitespace-nowrap"
              >
                적용하기
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-indigo-700/50 overflow-x-auto custom-scrollbar">
            <span className="text-[10px] font-bold text-indigo-400 shrink-0 whitespace-nowrap">현재 설정:</span>
            {dayNames.map((d, i) => {
              const capVal = displayCurrency === 'USD' ? dayCapsUSD[i] : dayCapsUSD[i] * safeRate;
              const capStr = displayCurrency === 'USD' ? `$${capVal.toFixed(2)}` : `${Math.round(capVal).toLocaleString()}원`;
              return (
                <div key={i} className="bg-indigo-900/40 text-indigo-100 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 border border-indigo-800 shrink-0 whitespace-nowrap">
                  <span className="font-black text-indigo-300">{d}</span> {capStr}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div className="flex justify-between items-center">
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-sm border border-slate-200">
          <button 
            onClick={() => setDisplayCurrency('USD')} 
            className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${
              displayCurrency === 'USD' ? 'bg-slate-300 text-slate-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            $ 달러 보기
          </button>
          <button 
            onClick={() => setDisplayCurrency('KRW')} 
            className={`px-5 py-2 rounded-lg text-sm font-black transition-all ${
              displayCurrency === 'KRW' ? 'bg-emerald-100 text-emerald-700 shadow-sm border border-emerald-200' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            ₩ 원화 보기
          </button>
        </div>

        <button onClick={initLocalTimeline} className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center gap-2">
          <span>↺</span> 원래 일정으로 복구
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableDays.map((dayStr, idx) => {
            const dayOfWeek = new Date(dayStr).getDay();
            const activeCapUSD = dayCapsUSD[dayOfWeek] || 17.80;
            const activeCap = displayCurrency === 'USD' ? activeCapUSD : activeCapUSD * safeRate;
            const dateLabel = `${idx + 1} (${new Date(dayStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })})`;

            return (
              <DroppableTransportColumn 
                key={dayStr} 
                dayStr={dayStr} 
                dateLabel={dateLabel} 
                items={localTimeline[dayStr]} 
                activeCap={activeCap} 
                displayCurrency={displayCurrency} 
                exchangeRate={safeRate} 
              />
            );
          })}
        </div>
        <DragOverlay>
          {activeItem ? <SortableTransportItem item={activeItem} displayCurrency={displayCurrency} exchangeRate={safeRate} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}