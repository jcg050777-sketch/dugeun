import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const parseSafeTimeData = (timeData) => {
  if (!timeData) return { h: 0, m: 0, str: 'AM 12:00', ampm: 'AM', hour: '12', minute: '00' };
  if (typeof timeData === 'object') {
    let h = parseInt(timeData.hour) || 0;
    const m = parseInt(timeData.minute || timeData.min) || 0;
    const ampm = timeData.ampm || 'AM';
    const str = `${ampm} ${String(timeData.hour || 12).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h, m, str, ampm, hour: String(timeData.hour || 12).padStart(2, '0'), minute: String(m).padStart(2, '0') };
  }
  if (typeof timeData === 'string') {
    const [ampm, rest] = timeData.split(' ');
    if (!rest || !rest.includes(':')) return { h: 0, m: 0, str: 'AM 12:00', ampm: 'AM', hour: '12', minute: '00' };
    const [hourStr, minStr] = rest.split(':');
    let h = parseInt(hourStr) || 0;
    const m = parseInt(minStr) || 0;
    let computedH = h;
    if (ampm === 'PM' && computedH < 12) computedH += 12;
    if (ampm === 'AM' && computedH === 12) computedH = 0;
    return { h: computedH, m, str: timeData, ampm, hour: String(hourStr).padStart(2, '0'), minute: String(minStr).padStart(2, '0') };
  }
  return { h: 0, m: 0, str: 'AM 12:00', ampm: 'AM', hour: '12', minute: '00' };
};

const formatTime = (ampm, hour, minute) => `${ampm} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

// ⭐️ 배경색(bg-white)을 제거하고 리스트와 똑같은 색상으로 맞춤!
const THEMES = {
  red: 'bg-red-100 text-red-700 border-red-200', orange: 'bg-orange-100 text-orange-700 border-orange-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200', emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  sky: 'bg-sky-100 text-sky-700 border-sky-200', indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200', fuchsia: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  rose: 'bg-rose-100 text-rose-700 border-rose-200', slate: 'bg-slate-100 text-slate-700 border-slate-200'
};

const getDynamicColor = (categoryName, categories) => {
  const cat = (categories || []).find(c => c.name === categoryName);
  const colorKey = cat ? cat.color : 'fuchsia';
  return THEMES[colorKey] || THEMES.fuchsia;
};

function SortableItem({ item, source }) {
  if (!item) return null;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-3 bg-white border border-slate-100 rounded-xl mb-2 shadow-sm flex items-center gap-3 cursor-grab hover:border-sky-300 transition-colors">
      <span className="text-slate-300">⋮⋮</span><span className="text-sm font-bold text-slate-700 truncate">{item.alias || '이름 없음'}</span>
    </div>
  );
}

function DroppableStorage({ items }) {
  const { setNodeRef } = useDroppable({ id: 'storage' });
  return (
    <div ref={setNodeRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[200px]">
      <SortableContext id="storage" items={(items || []).map(i => i.id)} strategy={verticalListSortingStrategy}>
        {(items || []).map(item => <SortableItem key={item.id} item={item} source="storage" />)}
        {(items || []).length === 0 && <div className="text-center text-slate-400 text-sm mt-10 font-bold border-2 border-dashed border-slate-200 p-6 rounded-xl">보관함이 비어있습니다.</div>}
      </SortableContext>
    </div>
  );
}

function TimelineItem({ item, dayStr, handleUpdateItem, handleRemoveFromTimeline, categories }) {
  if (!item) return null;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };
  const start = parseSafeTimeData(item.startTime); const end = parseSafeTimeData(item.endTime);
  const inputType = item.inputType || '시각';
  const colorClass = getDynamicColor(item.category, categories);

  const updateTime = (field, part, value) => {
    const current = parseSafeTimeData(item[field]);
    const updated = { ...current, [part]: value };
    handleUpdateItem(dayStr, item.id, field, formatTime(updated.ampm, updated.hour, updated.minute));
  };

  return (
    <div ref={setNodeRef} style={style} className={`p-2.5 px-4 bg-white border rounded-2xl mb-2.5 shadow-sm transition-all group flex flex-col xl:flex-row xl:items-center justify-between gap-3 ${isDragging ? 'border-sky-400 opacity-80 scale-[1.02]' : 'border-sky-100 hover:border-sky-300'}`}>
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-sky-500 pr-1 touch-none shrink-0">⋮⋮</div>
        <div className={`text-[10px] font-black px-1.5 py-0.5 rounded border shrink-0 ${colorClass}`}>{item.category || '관광'}</div>
        <span className="text-[15px] font-black text-slate-800 truncate">{item.alias || '이름 없음'}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
        <button onClick={() => handleUpdateItem(dayStr, item.id, 'inputType', inputType === '시각' ? '시간' : '시각')} className={`w-[72px] flex justify-center text-[11px] font-black py-1.5 rounded-lg transition-colors border shadow-sm shrink-0 ${inputType === '시간' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-sky-100 text-sky-700 border-sky-200'}`}>{inputType === '시간' ? '⏳ 시간' : '🕒 시각'}</button>
        <div className="bg-slate-50 border border-slate-100 p-1 rounded-lg flex items-center h-[34px] w-[260px] shrink-0">
          {inputType === '시각' ? (
            <div className="flex items-center gap-1 text-[12px] font-bold px-1.5 w-full">
              <select value={start.ampm} onChange={e => updateTime('startTime', 'ampm', e.target.value)} className="bg-transparent outline-none cursor-pointer"><option>AM</option><option>PM</option></select>
              <input type="text" value={start.hour} onChange={e => updateTime('startTime', 'hour', e.target.value)} className="w-5 text-center bg-transparent border-b border-slate-300 outline-none focus:border-sky-400" /><span className="text-slate-400">:</span><input type="text" value={start.minute} onChange={e => updateTime('startTime', 'minute', e.target.value)} className="w-5 text-center bg-transparent border-b border-slate-300 outline-none focus:border-sky-400" />
              <span className="text-slate-300 font-black mx-1">~</span>
              <select value={end.ampm} onChange={e => updateTime('endTime', 'ampm', e.target.value)} className="bg-transparent outline-none cursor-pointer"><option>AM</option><option>PM</option></select>
              <input type="text" value={end.hour} onChange={e => updateTime('endTime', 'hour', e.target.value)} className="w-5 text-center bg-transparent border-b border-slate-300 outline-none focus:border-sky-400" /><span className="text-slate-400">:</span><input type="text" value={end.minute} onChange={e => updateTime('endTime', 'minute', e.target.value)} className="w-5 text-center bg-transparent border-b border-slate-300 outline-none focus:border-sky-400" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[11px] px-1.5 w-full">
              <input type="number" step="0.5" value={item.duration || 1} onChange={e => handleUpdateItem(dayStr, item.id, 'duration', e.target.value)} className="w-10 text-center font-black text-indigo-700 bg-white border border-indigo-200 rounded outline-none" />
              <span className="font-bold text-slate-500 whitespace-nowrap">시간</span>
              <span className="font-bold text-indigo-400 whitespace-nowrap bg-indigo-50 px-1.5 py-0.5 rounded ml-1 hidden md:block">({item.computedStartStr || '...'} ~ {item.computedEndStr || '...'})</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end h-[34px] w-[40px] shrink-0"><button onClick={() => handleRemoveFromTimeline(dayStr, item.id)} className="text-[11px] font-bold text-slate-400 h-full transition-colors whitespace-nowrap hover:text-red-500">삭제</button></div>
      </div>
    </div>
  );
}

function DroppableDay({ dayStr, dateLabel, items, handleUpdateItem, handleRemoveFromTimeline, categories }) {
  const { setNodeRef } = useDroppable({ id: dayStr });
  let refH = 9, refM = 0;
  const computedItems = (items || []).map(item => {
      let startH, startM, endH, endM;
      if (item.inputType === '시간') {
          startH = refH; startM = refM;
          const totalMins = startH * 60 + startM + parseFloat(item.duration || 1) * 60;
          endH = Math.floor(totalMins / 60) % 24; endM = totalMins % 60;
      } else {
          const s = parseSafeTimeData(item.startTime); const e = parseSafeTimeData(item.endTime);
          startH = s.h; startM = s.m; endH = e.h; endM = e.m;
      }
      refH = endH; refM = endM;
      const formatH = (h) => ({ ampm: h >= 12 ? 'PM' : 'AM', hh: String(h % 12 === 0 ? 12 : h % 12).padStart(2, '0') });
      return { ...item, computedStartStr: `${formatH(startH).ampm} ${formatH(startH).hh}:${String(startM).padStart(2, '0')}`, computedEndStr: `${formatH(endH).ampm} ${formatH(endH).hh}:${String(endM).padStart(2, '0')}` };
  });

  return (
    <div ref={setNodeRef} className="bg-sky-50/30 rounded-3xl p-5 border border-sky-100 mb-8 shadow-sm">
      <h3 className="text-xl font-black text-sky-800 mb-4 flex items-end gap-2">Day <span className="text-sm font-bold text-slate-500 pb-0.5">{dateLabel}</span></h3>
      <SortableContext id={dayStr} items={computedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-[80px] border-2 border-dashed border-sky-100 rounded-2xl p-3 bg-white/50">
          {computedItems.map(item => <TimelineItem key={item.id} item={item} dayStr={dayStr} handleUpdateItem={handleUpdateItem} handleRemoveFromTimeline={handleRemoveFromTimeline} categories={categories} />)}
          {computedItems.length === 0 && <div className="text-center text-slate-400 font-bold text-sm py-6">여기로 일정을 끌어오세요</div>}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ScheduleEdit({ places, timeline, setTimeline, categories }) {
  const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState('');
  const [activeId, setActiveId] = useState(null); const [filterCategory, setFilterCategory] = useState('전체');
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    const keys = Object.keys(timeline || {}).sort();
    if (keys.length > 0) { if (!startDate) setStartDate(keys[0]); if (!endDate) setEndDate(keys[keys.length - 1]); }
  }, []);

  const handleApplyDates = () => {
    if (!startDate || !endDate) return alert('시작일과 종료일을 모두 선택해주세요.');
    const start = new Date(startDate); const end = new Date(endDate);
    if (start > end) return alert('종료일이 시작일보다 빠를 수 없습니다.');
    const validDays = []; let current = new Date(start);
    while (current <= end) { validDays.push(current.toISOString().split('T')[0]); current.setDate(current.getDate() + 1); }
    const newTimeline = {}; validDays.forEach(day => newTimeline[day] = []);
    const oldKeys = Object.keys(timeline || {}).sort();
    oldKeys.forEach((oldDay, idx) => {
      const items = timeline[oldDay] || [];
      if (idx < validDays.length) newTimeline[validDays[idx]].push(...items);
      else newTimeline[validDays[validDays.length - 1]].push(...items);
    });
    setTimeline(newTimeline); alert('✅ 여행 기간이 적용되었습니다!');
  };

  const filteredStorageItems = filterCategory === '전체' ? (places || []) : (places || []).filter(p => p.category === filterCategory);

  const handleDragStart = (event) => setActiveId(event.active.id);
  const handleDragEnd = (event) => {
    const { active, over } = event; setActiveId(null); if (!over) return;
    const sourceId = active.id; const targetContainer = over.id;
    let sourceDay = null; for (const day of Object.keys(timeline || {})) { if ((timeline[day] || []).find(i => i.id === sourceId)) { sourceDay = day; break; } }
    let targetDay = Object.keys(timeline || {}).includes(targetContainer) ? targetContainer : null;
    if (!targetDay) for (const day of Object.keys(timeline || {})) { if ((timeline[day] || []).find(i => i.id === targetContainer)) { targetDay = day; break; } }
    if (!targetDay) return;

    if (!sourceDay) {
        const place = (places || []).find(p => p.id === sourceId); if (!place) return;
        const newItem = { ...place, id: `tl_${place.id}_${Date.now()}_${Math.random().toString(36).substr(2,9)}`, originalId: place.id, inputType: '시각', startTime: 'PM 12:00', endTime: 'PM 01:00', duration: 1, memo: place.memo || '' };
        setTimeline(prev => { const targetItems = [...(prev[targetDay] || [])]; targetContainer !== targetDay ? targetItems.splice(targetItems.findIndex(i => i.id === targetContainer), 0, newItem) : targetItems.push(newItem); return { ...prev, [targetDay]: targetItems }; });
    } else if (sourceDay === targetDay) {
        setTimeline(prev => { const items = [...(prev[sourceDay] || [])]; return { ...prev, [sourceDay]: arrayMove(items, items.findIndex(i => i.id === sourceId), items.findIndex(i => i.id === targetContainer)) }; });
    } else {
        setTimeline(prev => { const sourceItems = [...(prev[sourceDay] || [])]; const targetItems = [...(prev[targetDay] || [])]; const [movedItem] = sourceItems.splice(sourceItems.findIndex(i => i.id === sourceId), 1); targetContainer !== targetDay ? targetItems.splice(targetItems.findIndex(i => i.id === targetContainer), 0, movedItem) : targetItems.push(movedItem); return { ...prev, [sourceDay]: sourceItems, [targetDay]: targetItems }; });
    }
  };

  const handleUpdateItem = (dayStr, itemId, field, value) => setTimeline(prev => ({ ...prev, [dayStr]: (prev[dayStr] || []).map(item => item.id === itemId ? { ...item, [field]: value } : item) }));
  const handleRemoveFromTimeline = (dayStr, itemId) => setTimeline(prev => ({ ...prev, [dayStr]: (prev[dayStr] || []).filter(item => item.id !== itemId) }));
  const activePlace = activeId ? (places || []).find(p => p.id === activeId) || Object.values(timeline || {}).flat().find(p => p.id === activeId) : null;

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-sky-100 flex flex-col md:flex-row items-center gap-6 justify-between">
        <h3 className="text-lg font-black text-sky-700 flex items-center gap-2"><span>🗓️</span> 여행 기간 설정</h3>
        <div className="flex items-center gap-3">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-sky-50 border border-sky-100 p-2.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-sky-400" /><span className="text-slate-300 font-bold">~</span><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-sky-50 border border-sky-100 p-2.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-sky-400" />
          <button onClick={handleApplyDates} className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition-colors ml-2">적용하기</button>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          <div className="w-full lg:w-72 bg-white rounded-3xl shadow-sm border border-sky-100 p-6 flex flex-col h-[600px] sticky top-[136px] z-20 shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-700 flex items-center gap-2"><span>🗂️</span> 보관함</h3>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="text-xs font-bold bg-sky-50 border border-sky-100 text-sky-700 p-1.5 rounded-lg outline-none"><option value="전체">전체 구분</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
            </div>
            <DroppableStorage items={filteredStorageItems} />
          </div>
          <div className="flex-1 w-full relative z-10">
            {Object.keys(timeline || {}).length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-sky-100 text-slate-400 font-bold flex flex-col items-center gap-4"><span className="text-6xl">📅</span><p>상단에서 여행 기간을 설정하고 [적용하기]를 누르면<br/>타임라인 보드가 생성됩니다!</p></div>
            ) : (
              Object.keys(timeline || {}).sort().map((dayStr, idx) => <DroppableDay key={dayStr} dayStr={dayStr} dateLabel={`${idx + 1} (${new Date(dayStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })})`} items={timeline[dayStr]} handleUpdateItem={handleUpdateItem} handleRemoveFromTimeline={handleRemoveFromTimeline} categories={categories} />)
            )}
          </div>
        </div>
        <DragOverlay>{activePlace ? <SortableItem item={activePlace} source="overlay" /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}