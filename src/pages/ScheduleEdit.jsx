import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ----------------------------------------------------
// 0. 커스텀 시간 입력 컴포넌트 (AM/PM + 직접 입력)
// ----------------------------------------------------
function CustomTimePicker({ value, onChange }) {
  const ampm = value?.ampm || 'AM';
  const hour = value?.hour || '';
  const min = value?.min || '00';

  const handleAmPm = () => onChange({ ...value, ampm: ampm === 'AM' ? 'PM' : 'AM' });
  const handleHour = (e) => onChange({ ...value, hour: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) });
  const handleMin = (e) => onChange({ ...value, min: e.target.value.replace(/[^0-9]/g, '').slice(0, 2) });

  return (
    <div className="flex items-center bg-white border border-sky-200 rounded-lg px-3 py-2 shadow-sm">
      <button type="button" onClick={handleAmPm} className="text-sm font-black text-sky-600 mr-2 hover:text-sky-800 w-7 text-left">
        {ampm}
      </button>
      <input type="text" value={hour} onChange={handleHour} placeholder="12" className="w-6 text-center text-sm font-bold outline-none text-slate-700 bg-transparent placeholder:text-sky-200" />
      <span className="text-sm text-sky-200 font-bold mx-1">:</span>
      <input type="text" value={min} onChange={handleMin} placeholder="00" className="w-6 text-center text-sm font-bold outline-none text-slate-700 bg-transparent placeholder:text-sky-200" />
    </div>
  );
}

// ----------------------------------------------------
// 1. 드래그 가능한 개별 아이템 컴포넌트
// ----------------------------------------------------
function SortableItem({ place, isTimelineItem, updateTimelineItem, deleteTimelineItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: place.id });
  
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    zIndex: isDragging ? 50 : 'auto', 
  };

  const inputType = place.inputType || '시간';

  // [보관함] 아이템 디자인
  if (!isTimelineItem) {
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="p-3 bg-white border border-sky-100 rounded-xl text-sm font-bold text-slate-700 cursor-grab hover:bg-sky-50 shadow-sm flex items-center gap-2 relative">
        <span className="text-sky-300">⋮⋮</span> {place.alias}
      </div>
    );
  }

  // [타임라인] 아이템 디자인
  return (
    <div ref={setNodeRef} style={style} className="relative pl-6 py-2 group flex gap-4">
      {/* 타임라인 파란 점선 */}
      <div className="absolute left-[7px] top-6 bottom-[-16px] w-[2px] bg-sky-100 group-last:bg-transparent"></div>
      <div className="absolute left-0 top-6 w-4 h-4 bg-white border-4 border-sky-400 rounded-full shadow-sm"></div>

      {/* 카드 본체 (크고 시원하게 가로 배치) */}
      <div className="flex-1 bg-white border border-sky-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group-hover:border-sky-300 flex justify-between items-center gap-4">
        
        {/* 왼쪽: 잡는 곳 + 별칭 */}
        <div className="flex items-center gap-3">
          <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-sky-500 touch-none py-2">
            ⋮⋮
          </div>
          <span className="font-bold text-slate-800 text-base">{place.alias}</span>
        </div>

        {/* 오른쪽: 시간 입력 컨트롤 영역 */}
        <div className="flex items-center gap-3 bg-sky-50/50 p-2 rounded-xl border border-sky-100/50">
          <button 
            onClick={() => updateTimelineItem(place.id, 'inputType', inputType === '시간' ? '시각' : '시간')}
            className="text-sm font-black bg-white border border-sky-200 text-sky-600 px-3 py-2 rounded-lg hover:bg-sky-100 transition-colors w-14 text-center shadow-sm"
          >
            {inputType}
          </button>
          
          {inputType === '시간' ? (
            <div className="flex items-center gap-2">
              <input 
                type="number" min="0" step="0.5"
                value={place.duration || ''} 
                onChange={(e) => updateTimelineItem(place.id, 'duration', e.target.value)}
                placeholder="숫자 입력" 
                className="w-24 text-sm p-2 bg-white border border-sky-200 rounded-md outline-none focus:border-sky-500 text-sky-700 font-bold text-center shadow-sm"
              />
              <span className="text-sm font-bold text-slate-500">시간</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-bold text-sky-700">
              <CustomTimePicker 
                value={place.startTime || { ampm: 'AM', hour: '', min: '00' }} 
                onChange={(val) => updateTimelineItem(place.id, 'startTime', val)} 
              />
              <span className="text-slate-300 mx-1">~</span>
              <CustomTimePicker 
                value={place.endTime || { ampm: 'PM', hour: '', min: '00' }} 
                onChange={(val) => updateTimelineItem(place.id, 'endTime', val)} 
              />
            </div>
          )}

          <button onClick={() => deleteTimelineItem(place.id)} className="text-slate-300 hover:text-red-500 text-sm font-bold px-2 ml-2 transition-colors">
            삭제
          </button>
        </div>

      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. 드롭 영역 (Day 보드)
// ----------------------------------------------------
function DroppableColumn({ dayStr, dateLabel, items, updateTimelineItem, deleteTimelineItem }) {
  const { setNodeRef } = useDroppable({ id: dayStr });

  return (
    <div ref={setNodeRef} className="bg-[#f8fbff] rounded-3xl p-6 border border-sky-100 shadow-sm flex flex-col mb-8 last:mb-0">
      <h4 className="font-black text-sky-700 border-b border-sky-200 pb-3 mb-4 flex items-end gap-2">
        <span className="text-2xl">Day</span> 
        <span className="text-sm font-bold text-slate-400 mb-1">{dateLabel}</span>
      </h4>
      
      <SortableContext id={dayStr} items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col min-h-[150px]">
          {items.length === 0 ? (
            <div className="flex-1 border-2 border-dashed border-sky-200 bg-sky-50/50 rounded-2xl flex items-center justify-center text-sm font-bold text-slate-400 mt-2 pointer-events-none">
              여기로 일정을 끌어오세요
            </div>
          ) : (
            items.map(item => (
              <SortableItem key={item.id} place={item} isTimelineItem={true} updateTimelineItem={(id, field, value) => updateTimelineItem(dayStr, id, field, value)} deleteTimelineItem={(id) => deleteTimelineItem(dayStr, id)} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ----------------------------------------------------
// 3. 메인 컴포넌트
// ----------------------------------------------------
export default function ScheduleEdit({ places, timeline, setTimeline }) {
  const [startDate, setStartDate] = useState('2026-12-13');
  const [endDate, setEndDate] = useState('2026-12-21');
  const [activeId, setActiveId] = useState(null);
  
  // 보관함 필터 상태
  const [filterCategory, setFilterCategory] = useState('전체');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));

  const getDaysArray = () => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return [];
    const arr = [];
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const dayStr = dt.toISOString().split('T')[0];
      const dateLabel = dt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
      arr.push({ dayStr, dateLabel });
    }
    return arr;
  };

  const days = getDaysArray();
  
  // 카테고리 필터 적용된 보관함 리스트
  const filteredPlaces = places.filter(p => filterCategory === '전체' || p.category === filterCategory);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeIdVal = active.id;
    const overIdVal = over.id;

    let sourceContainer = 'storage';
    for (const day of days) {
      if (timeline[day.dayStr]?.find(i => i.id === activeIdVal)) {
        sourceContainer = day.dayStr;
        break;
      }
    }

    let targetContainer = 'storage';
    if (days.find(d => d.dayStr === overIdVal)) {
      targetContainer = overIdVal; 
    } else {
      for (const day of days) {
        if (timeline[day.dayStr]?.find(i => i.id === overIdVal)) {
          targetContainer = day.dayStr;
          break;
        }
      }
    }

    if (sourceContainer === 'storage' && targetContainer !== 'storage') {
      const placeToAdd = places.find(p => p.id === activeIdVal);
      if (placeToAdd) {
        const newItem = {
          ...placeToAdd,
          id: `${placeToAdd.id}_${Date.now()}`,
          inputType: '시간', duration: '', startTime: { ampm: 'AM', hour: '', min: '00' }, endTime: { ampm: 'PM', hour: '', min: '00' }
        };
        setTimeline(prev => ({ ...prev, [targetContainer]: [...(prev[targetContainer] || []), newItem] }));
      }
      return;
    }

    if (sourceContainer !== 'storage' && targetContainer !== 'storage') {
      setTimeline(prev => {
        const sourceItems = [...(prev[sourceContainer] || [])];
        const targetItems = sourceContainer === targetContainer ? sourceItems : [...(prev[targetContainer] || [])];

        const sourceIndex = sourceItems.findIndex(i => i.id === activeIdVal);
        const [movedItem] = sourceItems.splice(sourceIndex, 1);

        const targetIndex = targetItems.findIndex(i => i.id === overIdVal);
        if (targetIndex >= 0) targetItems.splice(targetIndex, 0, movedItem);
        else targetItems.push(movedItem);

        return { ...prev, [sourceContainer]: sourceItems, [targetContainer]: targetItems };
      });
    }
  };

  const updateTimelineItem = (dayStr, itemId, field, value) => setTimeline(prev => ({ ...prev, [dayStr]: prev[dayStr].map(item => item.id === itemId ? { ...item, [field]: value } : item) }));
  const deleteTimelineItem = (dayStr, itemId) => setTimeline(prev => ({ ...prev, [dayStr]: prev[dayStr].filter(item => item.id !== itemId) }));

  const activeItem = places.find(p => p.id === activeId) || Object.values(timeline).flat().find(p => p.id === activeId);

  return (
    <div className="flex flex-col gap-6 relative">
      
      {/* ⭐️ 틀 고정 (Excel 스타일) - 배경색과 동일한 보호막 씌우기 */}
      <div className="sticky top-[136px] z-30 bg-[#fcfdff] pt-2 pb-4 -mx-2 px-2">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-sky-100 flex flex-wrap items-center gap-6">
          <h3 className="font-bold text-sky-700 text-lg">🗓️ 여행 기간 설정</h3>
          <div className="flex items-center gap-3">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2.5 bg-sky-50 border border-sky-100 rounded-lg outline-none focus:border-sky-400 text-sm font-bold text-slate-700" />
            <span className="text-slate-400 font-bold">~</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2.5 bg-sky-50 border border-sky-100 rounded-lg outline-none focus:border-sky-400 text-sm font-bold text-slate-700" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          
          <div className="lg:col-span-1">
            {/* 보관함 자체 스크롤 설정 */}
            <div className="bg-white rounded-3xl shadow-sm border border-sky-100 sticky top-[245px] z-20 max-h-[calc(100vh-270px)] flex flex-col">
              <div className="p-6 pb-4 border-b border-sky-50 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">🗂️ 보관함</h3>
                
                {/* ⭐️ 보관함 필터 (구분) */}
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="text-xs font-bold border border-sky-200 rounded-md p-1.5 outline-none text-sky-700 bg-sky-50"
                >
                  <option value="전체">전체 구분</option>
                  <option value="체험">체험</option>
                  <option value="식당">식당</option>
                  <option value="교통">교통</option>
                  <option value="관광">관광</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              
              <div className="p-6 pt-4 overflow-y-auto custom-scrollbar flex-1">
                <SortableContext id="storage" items={filteredPlaces.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {filteredPlaces.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-10">해당하는 일정이 없어요.</div>
                    ) : (
                      filteredPlaces.map(place => (
                        <SortableItem key={place.id} place={place} isTimelineItem={false} />
                      ))
                    )}
                  </div>
                </SortableContext>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 relative z-0">
            {days.length === 0 ? (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-sky-100 min-h-[500px] flex flex-col items-center justify-center text-slate-400 italic space-y-2">
                <span className="text-4xl">✈️</span>
                <p>위에서 여행 시작일과 종료일을 설정해주세요.</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {days.map((day, idx) => (
                  <DroppableColumn key={day.dayStr} dayStr={day.dayStr} dateLabel={`${idx + 1} (${day.dateLabel})`} items={timeline[day.dayStr] || []} updateTimelineItem={updateTimelineItem} deleteTimelineItem={deleteTimelineItem} />
                ))}
              </div>
            )}
          </div>

          <DragOverlay>
            {activeItem ? (
              <div className="p-3 bg-white border-2 border-sky-400 rounded-xl text-sm font-bold text-sky-700 shadow-xl opacity-90 rotate-3 z-50 flex items-center gap-2">
                <span className="text-sky-300">⋮⋮</span> {activeItem.alias}
              </div>
            ) : null}
          </DragOverlay>

        </DndContext>
      </div>
    </div>
  );
}