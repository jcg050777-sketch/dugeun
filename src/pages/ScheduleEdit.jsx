import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const parseTime = (timeStr) => {
  if (!timeStr) return { ampm: 'AM', hour: '12', minute: '00' };
  const [ampm, rest] = timeStr.split(' ');
  const [hour, minute] = rest.split(':');
  return { ampm, hour, minute };
};

const formatTime = (ampm, hour, minute) => `${ampm} ${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

function SortableItem({ item, source }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-3 bg-white border border-slate-100 rounded-xl mb-2 shadow-sm flex items-center gap-3 cursor-grab hover:border-sky-300 transition-colors">
      <span className="text-slate-300">⋮⋮</span>
      <span className="text-sm font-bold text-slate-700 truncate">{item.alias}</span>
    </div>
  );
}

function DroppableStorage({ items }) {
  const { setNodeRef } = useDroppable({ id: 'storage' });
  return (
    <div ref={setNodeRef} className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[200px]">
      <SortableContext id="storage" items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        {items.map(item => <SortableItem key={item.id} item={item} source="storage" />)}
        {items.length === 0 && <div className="text-center text-slate-400 text-sm mt-10 font-bold border-2 border-dashed border-slate-200 p-6 rounded-xl">보관함이 비어있습니다.</div>}
      </SortableContext>
    </div>
  );
}

function TimelineItem({ item, dayStr, handleUpdateItem, handleRemoveFromTimeline }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };

  const start = parseTime(item.startTime);
  const end = parseTime(item.endTime);
  
  // ⭐️ 메모창 토글 상태 (메모가 이미 있으면 처음부터 열려있도록 설정)
  const [showMemo, setShowMemo] = useState(!!item.memo);

  const updateTime = (field, part, value) => {
    const current = parseTime(item[field]);
    const updated = { ...current, [part]: value };
    handleUpdateItem(dayStr, item.id, field, formatTime(updated.ampm, updated.hour, updated.minute));
  };

  return (
    <div ref={setNodeRef} style={style} className={`p-4 bg-white border rounded-2xl mb-3 shadow-sm transition-all group ${isDragging ? 'border-sky-400 opacity-80 scale-[1.02]' : 'border-sky-100 hover:border-sky-300'}`}>
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-sky-500 px-1 touch-none">⋮⋮</div>
        <span className="text-base font-black text-slate-800 flex-1 truncate">{item.alias}</span>
        
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-400 px-1">시각</span>
            <select value={start.ampm} onChange={e => updateTime('startTime', 'ampm', e.target.value)} className="text-sm font-bold bg-white border border-slate-200 rounded p-1 outline-none"><option>AM</option><option>PM</option></select>
            <input type="text" value={start.hour} onChange={e => updateTime('startTime', 'hour', e.target.value)} className="w-8 text-center text-sm font-bold border border-slate-200 rounded p-1 outline-none" />
            <span className="text-slate-400 font-bold">:</span>
            <input type="text" value={start.minute} onChange={e => updateTime('startTime', 'minute', e.target.value)} className="w-8 text-center text-sm font-bold border border-slate-200 rounded p-1 outline-none" />
            
            <span className="text-slate-300 font-black mx-1">~</span>
            
            <select value={end.ampm} onChange={e => updateTime('endTime', 'ampm', e.target.value)} className="text-sm font-bold bg-white border border-slate-200 rounded p-1 outline-none"><option>AM</option><option>PM</option></select>
            <input type="text" value={end.hour} onChange={e => updateTime('endTime', 'hour', e.target.value)} className="w-8 text-center text-sm font-bold border border-slate-200 rounded p-1 outline-none" />
            <span className="text-slate-400 font-bold">:</span>
            <input type="text" value={end.minute} onChange={e => updateTime('endTime', 'minute', e.target.value)} className="w-8 text-center text-sm font-bold border border-slate-200 rounded p-1 outline-none" />
          </div>
          
          <div className="flex items-center gap-1">
            {/* ⭐️ 메모 토글 버튼 추가 */}
            <button onClick={() => setShowMemo(!showMemo)} className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors border ${showMemo || item.memo ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-sky-50 text-sky-600 border-sky-100 hover:bg-sky-100'}`}>메모</button>
            <button onClick={() => handleRemoveFromTimeline(dayStr, item.id)} className="text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors">삭제</button>
          </div>
        </div>
      </div>

      {/* ⭐️ 메모 입력칸 (센스있는 빨간색 + 기울임 꼴) */}
      {showMemo && (
        <div className="mt-3 pl-8 pr-2 flex items-center gap-2">
          <span className="text-rose-400 text-sm">💡</span>
          <input 
            type="text" 
            value={item.memo || ''} 
            onChange={(e) => handleUpdateItem(dayStr, item.id, 'memo', e.target.value)} 
            placeholder="준비물이나 주의사항을 적어주세요!" 
            className="flex-1 bg-rose-50/50 border border-rose-100 p-2 rounded-lg text-sm italic font-bold text-rose-500 placeholder:text-rose-300 outline-none focus:border-rose-300 focus:bg-rose-50 transition-colors"
          />
        </div>
      )}
    </div>
  );
}

function DroppableDay({ dayStr, dateLabel, items, handleUpdateItem, handleRemoveFromTimeline }) {
  const { setNodeRef } = useDroppable({ id: dayStr });

  return (
    <div ref={setNodeRef} className="bg-sky-50/30 rounded-3xl p-6 border border-sky-100 mb-8 shadow-sm">
      <h3 className="text-2xl font-black text-sky-800 mb-6 flex items-end gap-2">
        Day <span className="text-sm font-bold text-slate-500 pb-1">{dateLabel}</span>
      </h3>
      <SortableContext id={dayStr} items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="min-h-[100px] border-2 border-dashed border-sky-100 rounded-2xl p-4 bg-white/50">
          {items.map(item => (
            <TimelineItem key={item.id} item={item} dayStr={dayStr} handleUpdateItem={handleUpdateItem} handleRemoveFromTimeline={handleRemoveFromTimeline} />
          ))}
          {items.length === 0 && <div className="text-center text-slate-400 font-bold text-sm py-6">여기로 일정을 끌어오세요</div>}
        </div>
      </SortableContext>
    </div>
  );
}

export default function ScheduleEdit({ places, timeline, setTimeline }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [filterCategory, setFilterCategory] = useState('전체');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (start <= end) {
        const newTimeline = { ...timeline };
        let current = new Date(start);
        const validDays = [];
        while (current <= end) {
          const dayStr = current.toISOString().split('T')[0];
          validDays.push(dayStr);
          if (!newTimeline[dayStr]) newTimeline[dayStr] = [];
          current.setDate(current.getDate() + 1);
        }
        Object.keys(newTimeline).forEach(key => { if (!validDays.includes(key)) delete newTimeline[key]; });
        setTimeline(newTimeline);
      }
    }
  }, [startDate, endDate]);

  const assignedIds = Object.values(timeline).flat().map(item => item.id);
  const storageItems = places.filter(p => !assignedIds.includes(p.id));
  const filteredStorageItems = filterCategory === '전체' ? storageItems : storageItems.filter(p => p.category === filterCategory);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const sourceId = active.id;
    const targetContainer = over.id;

    let sourceContainer = 'storage';
    if (Object.keys(timeline).some(day => timeline[day].find(i => i.id === sourceId))) {
      sourceContainer = Object.keys(timeline).find(day => timeline[day].find(i => i.id === sourceId));
    }

    const isTargetDay = Object.keys(timeline).includes(targetContainer);
    let realTargetContainer = targetContainer;
    
    if (!isTargetDay && targetContainer !== 'storage') {
      realTargetContainer = Object.keys(timeline).find(day => timeline[day].find(i => i.id === targetContainer));
    }

    if (!realTargetContainer) return;

    if (sourceContainer === 'storage' && realTargetContainer !== 'storage') {
      const place = places.find(p => p.id === sourceId);
      const newItem = { ...place, startTime: 'PM 12:00', endTime: 'PM 01:00', memo: '' };
      setTimeline(prev => ({
        ...prev,
        [realTargetContainer]: [...prev[realTargetContainer], newItem]
      }));
    } 
    else if (sourceContainer !== 'storage' && realTargetContainer === 'storage') {
      setTimeline(prev => ({
        ...prev,
        [sourceContainer]: prev[sourceContainer].filter(i => i.id !== sourceId)
      }));
    }
    else if (sourceContainer !== 'storage' && realTargetContainer !== 'storage') {
      setTimeline(prev => {
        const sourceItems = [...prev[sourceContainer]];
        const targetItems = sourceContainer === realTargetContainer ? sourceItems : [...prev[realTargetContainer]];
        
        const sourceIndex = sourceItems.findIndex(i => i.id === sourceId);
        const [movedItem] = sourceItems.splice(sourceIndex, 1);
        
        if (targetContainer !== realTargetContainer) {
          const targetIndex = targetItems.findIndex(i => i.id === targetContainer);
          targetItems.splice(targetIndex, 0, movedItem);
        } else {
          targetItems.push(movedItem);
        }

        return {
          ...prev,
          [sourceContainer]: sourceItems,
          [realTargetContainer]: targetItems
        };
      });
    }
  };

  const handleUpdateItem = (dayStr, itemId, field, value) => {
    setTimeline(prev => ({
      ...prev,
      [dayStr]: prev[dayStr].map(item => item.id === itemId ? { ...item, [field]: value } : item)
    }));
  };

  const handleRemoveFromTimeline = (dayStr, itemId) => {
    setTimeline(prev => ({
      ...prev,
      [dayStr]: prev[dayStr].filter(item => item.id !== itemId)
    }));
  };

  const activePlace = activeId ? places.find(p => p.id === activeId) || Object.values(timeline).flat().find(p => p.id === activeId) : null;

  return (
    <div className="flex flex-col gap-8 pb-20">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-sky-100 flex items-center gap-6 sticky top-36 z-30">
        <h3 className="text-lg font-black text-sky-700 flex items-center gap-2"><span>🗓️</span> 여행 기간 설정</h3>
        <div className="flex items-center gap-3">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-sky-50 border border-sky-100 p-2.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-sky-400" />
          <span className="text-slate-300 font-bold">~</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-sky-50 border border-sky-100 p-2.5 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-sky-400" />
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          
          <div className="w-full lg:w-72 bg-white rounded-3xl shadow-sm border border-sky-100 p-6 flex flex-col h-[600px] sticky top-60 z-20 shrink-0">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-700 flex items-center gap-2"><span>🗂️</span> 보관함</h3>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="text-xs font-bold bg-sky-50 border border-sky-100 text-sky-700 p-1.5 rounded-lg outline-none">
                <option value="전체">전체 구분</option>
                <option value="체험">체험</option><option value="식당">식당</option><option value="교통">교통</option><option value="관광">관광</option><option value="기타">기타</option>
              </select>
            </div>
            <DroppableStorage items={filteredStorageItems} />
          </div>

          <div className="flex-1 w-full relative z-10">
            {Object.keys(timeline).length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-sky-100 text-slate-400 font-bold flex flex-col items-center gap-4">
                <span className="text-6xl">📅</span>
                <p>상단에서 여행 기간을 설정하면<br/>타임라인 보드가 생성됩니다!</p>
              </div>
            ) : (
              Object.keys(timeline).sort().map((dayStr, idx) => {
                const dateLabel = new Date(dayStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
                return (
                  <DroppableDay key={dayStr} dayStr={dayStr} dateLabel={`${idx + 1} (${dateLabel})`} items={timeline[dayStr]} handleUpdateItem={handleUpdateItem} handleRemoveFromTimeline={handleRemoveFromTimeline} />
                );
              })
            )}
          </div>
        </div>

        <DragOverlay>
          {activePlace ? <SortableItem item={activePlace} source="overlay" /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}