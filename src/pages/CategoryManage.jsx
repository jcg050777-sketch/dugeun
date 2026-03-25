import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableCategoryItem({ category, handleEdit, handleDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : 'auto' };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-4 p-4 border rounded-2xl transition-all group relative z-10 bg-white ${isDragging ? 'border-sky-400 shadow-md opacity-80 scale-[1.02]' : 'border-sky-50 hover:shadow-sm hover:border-sky-200'}`}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-sky-500 px-2 touch-none">
        ⋮⋮
      </div>
      <div className="flex-1 flex items-center gap-3">
        <span className="text-xl">🏷️</span>
        <h4 className="font-black text-lg text-slate-800">{category.name}</h4>
      </div>
      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => handleEdit(category)} className="text-xs bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg hover:bg-sky-100 font-bold border border-sky-100">수정</button>
        <button onClick={() => handleDelete(category.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-bold border border-red-100">삭제</button>
      </div>
    </div>
  );
}

export default function CategoryManage({ categories, setCategories }) {
  const [formName, setFormName] = useState('');
  const [editId, setEditId] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

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
    const trimmedName = formName.trim();
    if (!trimmedName) return alert('구분(카테고리) 이름을 입력해주세요!');

    if (editId) {
      // 중복 검사 (자기 자신 제외)
      if (categories.some(c => c.name === trimmedName && c.id !== editId)) {
        return alert('이미 존재하는 구분입니다.');
      }
      setCategories(categories.map(c => c.id === editId ? { ...c, name: trimmedName } : c));
      setEditId(null);
    } else {
      // 중복 검사
      if (categories.some(c => c.name === trimmedName)) {
        return alert('이미 존재하는 구분입니다.');
      }
      setCategories([...categories, { id: `cat_${Date.now()}`, name: trimmedName }]);
    }
    setFormName('');
  };

  const handleEdit = (category) => {
    setFormName(category.name);
    setEditId(category.id);
  };

  const handleDelete = (id) => {
    if (categories.length <= 1) return alert('최소 1개의 구분은 남아있어야 합니다.');
    if (window.confirm('이 구분을 삭제할까요? (이미 작성된 일정의 데이터는 삭제되지 않습니다)')) {
      setCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
      <section className="lg:col-span-1">
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-sky-100 sticky top-36">
          <h3 className="text-sky-700 text-xl font-black mb-4 flex items-center gap-2"><span>🏷️</span> 구분(카테고리) 등록</h3>
          <p className="text-xs text-slate-400 font-bold mb-6">일정 리스트에서 사용할 '구분' 항목을 추가하거나 수정합니다.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">구분 이름 <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={formName} 
                onChange={(e) => setFormName(e.target.value)} 
                placeholder="ex) 쇼핑, 액티비티, 숙소" 
                className="w-full p-3 bg-sky-50 border border-sky-100 rounded-xl outline-none focus:border-sky-400 text-sm font-bold text-slate-700 placeholder:text-slate-300" 
              />
            </div>
            <button type="submit" className={`w-full text-white py-3 rounded-xl font-black transition-all shadow-md mt-4 ${editId ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-sky-600 hover:bg-sky-700'}`}>
              {editId ? '수정 완료' : '새 구분 추가하기'}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setFormName(''); }} className="w-full bg-slate-100 text-slate-500 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all mt-2">
                취소
              </button>
            )}
          </form>
        </div>
      </section>

      <section className="lg:col-span-2">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-sky-100 min-h-[500px]">
          <h3 className="text-xl font-black text-slate-800 mb-6 border-b border-sky-100 pb-4 flex items-center justify-between">
            <span>현재 등록된 구분</span>
            <span className="text-sm font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-lg">총 {categories.length}개</span>
          </h3>
          
          <div className="bg-sky-50/50 text-sky-800 text-sm font-bold p-4 rounded-xl text-center mb-6 border border-sky-100 flex flex-col gap-1 items-center justify-center">
            <span>💡 드래그하여 순서를 변경할 수 있습니다.</span>
            <span className="text-xs text-sky-600">변경된 순서와 이름은 앱 전체의 드롭다운(목록 박스) 필터에 즉시 적용됩니다.</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {categories.map((cat) => (
                  <SortableCategoryItem key={cat.id} category={cat} handleEdit={handleEdit} handleDelete={handleDelete} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      </section>
    </div>
  );
}