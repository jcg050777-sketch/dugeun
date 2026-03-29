import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const COLOR_THEMES = [
  { key: 'red', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  { key: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  { key: 'amber', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  { key: 'emerald', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  { key: 'sky', bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200' },
  { key: 'indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200' },
  { key: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
  { key: 'fuchsia', bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  { key: 'rose', bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  { key: 'slate', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
];

function SortableCategoryItem({ category, handleEdit, deleteCategory }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto', opacity: isDragging ? 0.5 : 1 };
  const theme = COLOR_THEMES.find(t => t.key === category.color) || COLOR_THEMES[7];

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center justify-between p-4 bg-white border rounded-2xl mb-3 shadow-sm transition-all ${isDragging ? 'border-sky-400 scale-[1.02]' : 'border-slate-200 hover:border-sky-300'}`}>
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-sky-500 touch-none px-1">⋮⋮</div>
        <span className={`px-3 py-1.5 rounded-lg text-xs font-black border ${theme.bg} ${theme.text} ${theme.border}`}>{category.name}</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => handleEdit(category)} className="text-xs font-bold text-slate-400 hover:text-sky-600 px-2 py-1 transition-colors">수정</button>
        <button onClick={() => deleteCategory(category.id)} className="text-xs font-bold text-slate-400 hover:text-red-500 px-2 py-1 transition-colors">삭제</button>
      </div>
    </div>
  );
}

export default function CategoryManage({ categories, setCategories }) {
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState('sky');
  const [editId, setEditId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return alert('구분 이름을 입력해주세요!');
    
    if (editId) {
      setCategories(categories.map(c => c.id === editId ? { ...c, name: newCatName.trim(), color: selectedColor } : c));
      setEditId(null);
    } else {
      if (categories.find(c => c.name === newCatName.trim())) return alert('이미 존재하는 구분입니다.');
      setCategories([...categories, { id: `cat_${Date.now()}`, name: newCatName.trim(), color: selectedColor }]);
    }
    setNewCatName('');
    setSelectedColor('sky');
  };

  const handleEdit = (category) => {
    setEditId(category.id);
    setNewCatName(category.name);
    setSelectedColor(category.color || 'sky');
  };

  const handleDelete = (id) => {
    if(window.confirm('이 구분을 삭제하시겠습니까? (기존 일정의 구분 이름은 그대로 유지되지만 색상은 기본색으로 변합니다)')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start relative pb-20">
      <section className="md:col-span-1 sticky top-[100px] md:top-[136px]">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-sky-100">
          <h3 className="text-sky-700 text-lg font-black mb-4 flex items-center gap-2"><span>🏷️</span> 구분(카테고리) {editId ? '수정' : '등록'}</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-500 mb-2">구분 이름 <span className="text-red-500">*</span></label>
              <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} placeholder="ex) 마트, 숙소, 투어" className="w-full p-3 bg-sky-50 border border-sky-100 rounded-xl outline-none focus:border-sky-400 text-sm font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-500 mb-3">테마 색상 선택</label>
              <div className="flex flex-wrap gap-3">
                {COLOR_THEMES.map(theme => (
                  <button key={theme.key} type="button" onClick={() => setSelectedColor(theme.key)} className={`w-8 h-8 rounded-full ${theme.bg} ${theme.border} border-2 flex items-center justify-center transition-transform hover:scale-110 ${selectedColor === theme.key ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}>
                    {selectedColor === theme.key && <span className={`text-xs ${theme.text}`}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <button type="submit" className="w-full bg-sky-600 text-white py-3 rounded-xl font-black hover:bg-sky-700 transition-colors shadow-sm">{editId ? '수정 완료' : '새 구분 추가하기'}</button>
              {editId && <button type="button" onClick={() => { setEditId(null); setNewCatName(''); setSelectedColor('sky'); }} className="w-full bg-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-300 transition-colors">취소</button>}
            </div>
          </form>
        </div>
      </section>

      <section className="md:col-span-2">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-sky-100 min-h-[500px]">
          <div className="flex items-center justify-between mb-6 border-b border-sky-100 pb-4">
            <h3 className="text-xl font-black text-slate-800">현재 등록된 구분</h3>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-lg">총 {categories.length}개</span>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {categories.map(category => <SortableCategoryItem key={category.id} category={category} handleEdit={handleEdit} deleteCategory={handleDelete} />)}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </section>
    </div>
  );
}