import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const calculateDday = (targetDate) => {
  if (!targetDate) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diff = target.getTime() - today.getTime();
  const dDay = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (dDay === 0) return 'D-Day';
  if (dDay > 0) return `D-${dDay}`;
  return `D+${Math.abs(dDay)}`;
};

function SortablePrepareItem({ item, updateItem, deleteItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.5 : 1 };
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div ref={setNodeRef} style={style} className={`bg-white border rounded-2xl mb-3 shadow-sm group transition-all ${isDragging ? 'border-sky-400 scale-[1.01]' : 'border-slate-200 md:hover:border-sky-300'}`}>
      
      {/* ⭐️ PC 뷰 (md 이상에서만 표시) */}
      <div className="hidden md:flex items-center gap-3 p-3.5">
        <div {...attributes} {...listeners} className="cursor-grab text-slate-300 hover:text-sky-500 touch-none px-1">⋮⋮</div>
        <div className="flex-1 grid grid-cols-2 gap-4 pl-2 items-center">
          {isEditing ? (
            <>
              <input type="text" value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} className="w-full text-[15px] font-black bg-transparent outline-none border-b border-sky-300 px-1 py-0.5 text-slate-800" autoFocus />
              <input type="text" value={item.method} onChange={(e) => updateItem(item.id, 'method', e.target.value)} className="w-full text-[14px] font-bold bg-transparent outline-none border-b border-sky-300 px-1 py-0.5 text-sky-600" />
            </>
          ) : (
            <>
              <span className={`text-[15px] font-black px-1 py-0.5 truncate ${item.isChecked ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{item.name}</span>
              <span className={`text-[14px] font-bold px-1 py-0.5 truncate ${item.isChecked ? 'text-slate-200' : 'text-sky-600'}`}>{item.method || '-'}</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-center px-4 border-l border-slate-100">
          <input type="checkbox" checked={item.isChecked} onChange={(e) => updateItem(item.id, 'isChecked', e.target.checked)} className="w-5 h-5 accent-sky-500 cursor-pointer rounded-md hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsEditing(!isEditing)} className={`text-[12px] font-bold px-2 py-1 transition-colors whitespace-nowrap ${isEditing ? 'text-sky-500' : 'text-slate-300'}`}>
            {isEditing ? '완료' : '수정'}
          </button>
          <button onClick={() => deleteItem(item.id)} className="text-[12px] font-bold text-slate-300 px-2 py-1 transition-colors whitespace-nowrap">삭제</button>
        </div>
      </div>

      {/* ⭐️ 모바일 뷰어 전용 레이아웃 (체크박스와 텍스트만 깔끔하게!) */}
      <div className="flex md:hidden items-center justify-between p-4 gap-3">
        <input type="checkbox" checked={item.isChecked} onChange={(e) => updateItem(item.id, 'isChecked', e.target.checked)} className="w-6 h-6 accent-sky-500 rounded-md shrink-0" />
        <div className="flex flex-col flex-1 min-w-0">
          <span className={`text-[15px] font-black truncate ${item.isChecked ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{item.name}</span>
          <span className={`text-[12px] font-bold truncate mt-0.5 ${item.isChecked ? 'text-slate-200' : 'text-sky-600'}`}>{item.method || '-'}</span>
        </div>
      </div>
    </div>
  );
}

function DeadlineItem({ item, updateItem, deleteItem }) {
  const [isEditing, setIsEditing] = useState(false);
  const dDayStr = calculateDday(item.date);
  const isUrgent = dDayStr === 'D-Day' || (dDayStr.startsWith('D-') && parseInt(dDayStr.replace('D-', '')) <= 3) || dDayStr.startsWith('D+');

  return (
    <div className="bg-white border rounded-2xl mb-3 shadow-sm group transition-all border-slate-200 md:hover:border-indigo-300">
      
      {/* ⭐️ PC 뷰 */}
      <div className="hidden md:flex items-center gap-3 p-3.5">
        <div className={`w-16 shrink-0 text-center text-[12px] font-black px-2 py-1.5 rounded-lg border ml-2 ${item.isChecked ? 'bg-slate-50 text-slate-300 border-slate-100' : isUrgent ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
          {dDayStr || '미정'}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4 pl-2 items-center">
          {isEditing ? (
            <>
              <input type="text" value={item.task} onChange={(e) => updateItem(item.id, 'task', e.target.value)} className="w-full text-[15px] font-black bg-transparent outline-none border-b border-indigo-300 px-1 py-0.5 text-slate-800" autoFocus />
              <input type="date" value={item.date} onChange={(e) => updateItem(item.id, 'date', e.target.value)} className="w-[130px] text-[13px] font-bold bg-transparent outline-none border-b border-indigo-300 px-1 py-0.5 text-slate-700 cursor-pointer" />
            </>
          ) : (
            <>
              <span className={`text-[15px] font-black px-1 py-0.5 truncate ${item.isChecked ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{item.task}</span>
              <span className={`text-[13px] font-bold px-1 py-0.5 truncate ${item.isChecked ? 'text-slate-300' : 'text-slate-500'}`}>{item.date}</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-center px-4 border-l border-slate-100">
          <input type="checkbox" checked={item.isChecked} onChange={(e) => updateItem(item.id, 'isChecked', e.target.checked)} className="w-5 h-5 accent-indigo-500 cursor-pointer rounded-md hover:scale-110 transition-transform" />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsEditing(!isEditing)} className={`text-[12px] font-bold px-2 py-1 transition-colors whitespace-nowrap ${isEditing ? 'text-indigo-500' : 'text-slate-300'}`}>
            {isEditing ? '완료' : '수정'}
          </button>
          <button onClick={() => deleteItem(item.id)} className="text-[12px] font-bold text-slate-300 px-2 py-1 transition-colors whitespace-nowrap">삭제</button>
        </div>
      </div>

      {/* ⭐️ 모바일 뷰어 전용 레이아웃 */}
      <div className="flex md:hidden items-center justify-between p-4 gap-3">
        <div className={`w-14 shrink-0 text-center text-[11px] font-black px-1 py-1.5 rounded-lg border ${item.isChecked ? 'bg-slate-50 text-slate-300 border-slate-100' : isUrgent ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'}`}>
          {dDayStr || '미정'}
        </div>
        <div className="flex flex-col flex-1 min-w-0">
          <span className={`text-[15px] font-black truncate ${item.isChecked ? 'text-slate-300 line-through' : 'text-slate-800'}`}>{item.task}</span>
          <span className={`text-[11px] font-bold truncate mt-0.5 ${item.isChecked ? 'text-slate-300' : 'text-slate-400'}`}>{item.date}</span>
        </div>
        <input type="checkbox" checked={item.isChecked} onChange={(e) => updateItem(item.id, 'isChecked', e.target.checked)} className="w-6 h-6 accent-indigo-500 rounded-md shrink-0" />
      </div>
    </div>
  );
}

export default function SchedulePrepare() {
  const [viewMode, setViewMode] = useState('준비물');
  
  const [prepareItems, setPrepareItems] = useState(() => {
    const saved = localStorage.getItem('dugeun_prepare_items');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [deadlineItems, setDeadlineItems] = useState(() => {
    const saved = localStorage.getItem('dugeun_deadline_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [newItemName, setNewItemName] = useState('');
  const [newItemMethod, setNewItemMethod] = useState('');
  const [newDeadlineTask, setNewDeadlineTask] = useState('');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');

  useEffect(() => { localStorage.setItem('dugeun_prepare_items', JSON.stringify(prepareItems)); }, [prepareItems]);
  useEffect(() => { localStorage.setItem('dugeun_deadline_items', JSON.stringify(deadlineItems)); }, [deadlineItems]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handlePrepareDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPrepareItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddPrepare = (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return alert('추가할 품목 이름을 입력해주세요!');
    setPrepareItems([...prepareItems, { id: `prep_${Date.now()}`, name: newItemName, method: newItemMethod, isChecked: false }]);
    setNewItemName(''); setNewItemMethod('');
  };

  const handleAddDeadline = (e) => {
    e.preventDefault();
    if (!newDeadlineTask.trim()) return alert('할 일을 입력해주세요!');
    if (!newDeadlineDate) return alert('마감일을 지정해주세요!');
    setDeadlineItems([...deadlineItems, { id: `dead_${Date.now()}`, task: newDeadlineTask, date: newDeadlineDate, isChecked: false }]);
    setNewDeadlineTask(''); setNewDeadlineDate('');
  };

  const updatePrepareItem = (id, field, value) => { setPrepareItems(prepareItems.map(item => item.id === id ? { ...item, [field]: value } : item)); };
  const deletePrepareItem = (id) => { setPrepareItems(prepareItems.filter(item => item.id !== id)); };

  const updateDeadlineItem = (id, field, value) => { setDeadlineItems(deadlineItems.map(item => item.id === id ? { ...item, [field]: value } : item)); };
  const deleteDeadlineItem = (id) => { setDeadlineItems(deadlineItems.filter(item => item.id !== id)); };

  const sortedDeadlineItems = [...deadlineItems].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-sky-100 flex items-center justify-center sticky top-[120px] md:top-[136px] z-30">
        <div className="bg-sky-50 p-1 rounded-full flex gap-1 border border-sky-100 shadow-inner">
          <button onClick={() => setViewMode('준비물')} className={`px-6 md:px-8 py-2 rounded-full font-bold text-xs md:text-sm transition-all ${viewMode === '준비물' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-400 hover:text-sky-600'}`}>준비물</button>
          <button onClick={() => setViewMode('데드라인')} className={`px-6 md:px-8 py-2 rounded-full font-bold text-xs md:text-sm transition-all ${viewMode === '데드라인' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}>데드라인</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-sky-100 p-4 md:p-8 min-h-[400px] md:min-h-[600px] max-w-4xl mx-auto w-full">
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePrepareDragEnd}>
          {viewMode === '준비물' && (
            <div className="flex flex-col gap-4 md:gap-8">
              {/* ⭐️ 폼과 PC용 헤더는 모바일에서 숨김 */}
              <form onSubmit={handleAddPrepare} className="hidden md:flex flex-col sm:flex-row gap-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-inner">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-500 ml-1">품목 (필수)</label>
                  <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-sky-400 shadow-sm" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px] font-black text-slate-500 ml-1">구매/준비 방법</label>
                  <input type="text" value={newItemMethod} onChange={e => setNewItemMethod(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-sky-400 shadow-sm" />
                </div>
                <div className="flex flex-col gap-1 justify-end">
                  <button type="submit" className="bg-sky-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:bg-sky-700 transition-colors h-[42px]">추가하기</button>
                </div>
              </form>

              <div className="hidden md:flex items-center gap-4 px-6 pb-2 border-b border-slate-100 text-[12px] font-black text-slate-400">
                <div className="w-5"></div>
                <div className="flex-1 grid grid-cols-2 gap-4 pl-2">
                  <div>품목</div>
                  <div>구매 / 준비 방법</div>
                </div>
                <div className="w-12 text-center">확인</div>
                <div className="w-20 text-center"></div>
              </div>

              {prepareItems.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold"><p>등록된 준비물이 없습니다.</p></div>
              ) : (
                <SortableContext items={prepareItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {prepareItems.map(item => <SortablePrepareItem key={item.id} item={item} updateItem={updatePrepareItem} deleteItem={deletePrepareItem} />)}
                  </div>
                </SortableContext>
              )}
            </div>
          )}

          {viewMode === '데드라인' && (
            <div className="flex flex-col gap-4 md:gap-8">
              <form onSubmit={handleAddDeadline} className="hidden md:flex flex-col sm:flex-row gap-3 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100 shadow-inner">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[11px] font-black text-indigo-400 ml-1">할 일 (필수)</label>
                  <input type="text" value={newDeadlineTask} onChange={e => setNewDeadlineTask(e.target.value)} className="bg-white border border-indigo-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-indigo-400 shadow-sm" />
                </div>
                <div className="w-full sm:w-48 flex flex-col gap-1">
                  <label className="text-[11px] font-black text-indigo-400 ml-1">마감일 (필수)</label>
                  <input type="date" value={newDeadlineDate} onChange={e => setNewDeadlineDate(e.target.value)} className="bg-white border border-indigo-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 shadow-sm font-bold text-slate-700 cursor-pointer" />
                </div>
                <div className="flex flex-col gap-1 justify-end">
                  <button type="submit" className="bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 transition-colors h-[42px]">추가하기</button>
                </div>
              </form>

              <div className="hidden md:flex items-center gap-4 px-6 pb-2 border-b border-slate-100 text-[12px] font-black text-slate-400">
                <div className="w-16 text-center text-indigo-300 ml-2">D-Day</div>
                <div className="flex-1 grid grid-cols-2 gap-4 pl-2">
                  <div>할 일</div>
                  <div>마감일</div>
                </div>
                <div className="w-12 text-center">완료</div>
                <div className="w-20 text-center"></div>
              </div>

              {sortedDeadlineItems.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-bold"><p>등록된 데드라인이 없습니다.</p></div>
              ) : (
                <div className="space-y-1">
                  {sortedDeadlineItems.map(item => <DeadlineItem key={item.id} item={item} updateItem={updateDeadlineItem} deleteItem={deleteDeadlineItem} />)}
                </div>
              )}
            </div>
          )}
        </DndContext>
      </div>
    </div>
  );
}