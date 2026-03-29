import React, { useState, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Autocomplete } from '@react-google-maps/api';

function SortableItem({ place, getCategoryColor, handleEdit, handleDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: place.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 md:gap-4 p-4 border border-sky-50 rounded-2xl md:hover:shadow-md hover:border-sky-200 transition-all bg-white group relative z-10">
      {/* ⭐️ 모바일에서는 드래그 핸들 숨김 */}
      <div {...attributes} {...listeners} className="hidden md:block cursor-grab active:cursor-grabbing text-slate-300 hover:text-sky-500 px-2 touch-none">⋮⋮</div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-black px-2 py-1 rounded-md border shrink-0 ${getCategoryColor(place.category)}`}>{place.category}</span>
          <h4 className="font-bold text-base md:text-lg text-slate-800 truncate">{place.alias}</h4>
        </div>
        <p className="text-slate-500 text-sm truncate">{place.content}</p>
        
        {place.memo && (
          <p className="text-[12px] italic font-black text-rose-500 mt-1 flex items-center gap-1 truncate">
            <span className="drop-shadow-sm shrink-0">📌</span> <span className="truncate">{place.memo}</span>
          </p>
        )}

        {place.location ? (
          <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1 truncate">
            <span className="shrink-0">📍</span> <span className="font-bold text-sky-700 shrink-0">{place.location.name}</span> <span className="text-slate-300 truncate hidden sm:inline">({place.location.address})</span>
          </p>
        ) : (
          <p className="text-slate-400 text-xs mt-1.5 flex items-center gap-1 italic shrink-0"><span>📍</span> 위치 미지정</p>
        )}
      </div>
      
      {/* ⭐️ 모바일에서는 수정/삭제 버튼 숨김 */}
      <div className="hidden md:flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={() => handleEdit(place)} className="text-xs bg-sky-50 text-sky-600 px-3 py-1 rounded hover:bg-sky-100 font-bold">수정</button>
        <button onClick={() => handleDelete(place.id)} className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100 font-bold">삭제</button>
      </div>
    </div>
  );
}

const ScheduleList = ({ places, setPlaces, timeline, setTimeline, categories, googleMapsLoaded }) => {
  const categoryNames = categories ? categories.map(c => c.name) : ['관광'];
  const FILTER_CATEGORIES = ['전체', ...categoryNames];

  const [form, setForm] = useState({ alias: '', category: categoryNames[0] || '관광', content: '', memo: '', location: null });
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState('전체');

  const autocompleteRef = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setPlaces((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry || !place.geometry.location) {
        alert("자동완성 목록에서 장소를 정확히 클릭해서 선택해주세요!");
        return;
      }
      setForm({
        ...form,
        location: { name: place.name, address: place.formatted_address, lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.alias.trim()) return alert('별칭을 입력해주세요!');
    
    if (editId) {
      const oldPlace = places.find(p => p.id === editId);
      const oldAlias = oldPlace ? oldPlace.alias : null;

      setPlaces(places.map(p => p.id === editId ? { ...form, id: editId } : p));

      if (timeline && setTimeline) {
        setTimeline(prevTimeline => {
          const nextTimeline = { ...prevTimeline };
          Object.keys(nextTimeline).forEach(day => {
            nextTimeline[day] = nextTimeline[day].map(tItem => {
              if (tItem.originalId === editId || (oldAlias && tItem.alias === oldAlias) || tItem.id === editId) {
                return { ...tItem, alias: form.alias, category: form.category, content: form.content, memo: form.memo, location: form.location };
              }
              return tItem;
            });
          });
          return nextTimeline;
        });
      }
      setEditId(null);
    } else {
      setPlaces([...places, { ...form, id: Date.now().toString() }]);
    }
    
    setForm({ alias: '', category: form.category, content: '', memo: '', location: null });
    const inputEl = document.getElementById('google-autocomplete-input');
    if (inputEl) inputEl.value = '';
  };

  const handleDelete = (id) => { if(window.confirm('정말 삭제할까요?')) setPlaces(places.filter(p => p.id !== id)); };

  const handleEdit = (place) => {
    setForm({ ...place, memo: place.memo || '' });
    setEditId(place.id);
    const inputEl = document.getElementById('google-autocomplete-input');
    if (inputEl) inputEl.value = place.location?.name || '';
  };

  const getCategoryColor = (category) => {
    const colors = { '체험': 'bg-orange-100 text-orange-700 border-orange-200', '식당': 'bg-red-100 text-red-700 border-red-200', '교통': 'bg-indigo-100 text-indigo-700 border-indigo-200', '관광': 'bg-emerald-100 text-emerald-700 border-emerald-200', '기타': 'bg-slate-100 text-slate-700 border-slate-200' };
    return colors[category] || 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
  };

  const filteredPlaces = filter === '전체' ? places : places.filter(p => p.category === filter);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start relative">
      
      {/* ⭐️ 모바일에서는 등록 폼 전체를 숨김 처리! (hidden md:block) */}
      <section className="hidden md:block md:col-span-1 sticky top-[136px]"> 
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-sky-100">
          <h3 className="text-sky-700 text-xl font-bold mb-4 flex items-center gap-2"><span>📝</span> 등록</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">별칭 (목록 이름) <span className="text-red-500">*</span></label>
              <input type="text" value={form.alias} onChange={(e) => setForm({...form, alias: e.target.value})} placeholder="ex) 오페라 하우스" className="w-full p-3 bg-sky-50 border border-sky-100 rounded-xl outline-none focus:border-sky-400 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">구분 <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} className="w-full p-3 bg-sky-50 border border-sky-100 rounded-xl outline-none focus:border-sky-400 text-sm font-bold">
                {categoryNames.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">내용 (할 일)</label>
              <textarea value={form.content} onChange={(e) => setForm({...form, content: e.target.value})} placeholder="ex) 야경 배경으로 사진 찍기" className="w-full p-3 bg-sky-50 border border-sky-100 rounded-xl outline-none focus:border-sky-400 text-sm h-16 resize-none custom-scrollbar" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><span className="text-[10px]">📌</span> 메모 (일정 체크용)</label>
              <input type="text" value={form.memo} onChange={(e) => setForm({...form, memo: e.target.value})} placeholder="ex) 여권 필수, 예약 바우처 확인" className="w-full p-3 bg-rose-50 border border-rose-100 rounded-xl outline-none focus:border-rose-300 text-sm italic font-bold text-rose-500 placeholder:text-rose-300 placeholder:font-normal" />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-slate-500 mb-1">위치 (구글 검색)</label>
              {googleMapsLoaded ? (
                <Autocomplete onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }} onPlaceChanged={onPlaceChanged}>
                  <input id="google-autocomplete-input" type="text" placeholder="장소 검색" onChange={() => setForm({...form, location: null})} className="w-full p-3 bg-sky-50 border border-sky-100 rounded-xl outline-none focus:border-sky-400 text-sm" />
                </Autocomplete>
              ) : (
                <input type="text" placeholder="구글 맵 불러오는 중..." disabled className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-sm" />
              )}
              {form.location && (
                <div className="mt-2 text-[10px] bg-sky-100 text-sky-700 p-2 rounded-lg font-bold flex flex-col gap-1">
                  <div className="flex items-center gap-1"><span>✅</span> 장소 선택 완료!</div>
                  <span className="text-slate-500 truncate pl-4">{form.location.address}</span>
                </div>
              )}
            </div>
            <button type="submit" className="w-full bg-sky-600 text-white py-3 rounded-xl font-black hover:bg-sky-700 transition-all shadow-md mt-4">
              {editId ? '수정 완료' : '리스트에 추가하기'}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm({ alias: '', category: form.category, content: '', memo: '', location: null }); const inputEl = document.getElementById('google-autocomplete-input'); if (inputEl) inputEl.value = ''; }} className="w-full bg-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-300 transition-all mt-2">취소</button>
            )}
          </form>
        </div>
      </section>

      {/* ⭐️ 모바일에서는 리스트가 화면 전체를 차지함 (col-span-full) */}
      <section className="col-span-1 md:col-span-2">
        <div className="bg-white p-4 md:p-8 rounded-3xl shadow-lg border border-sky-100 min-h-[500px]">
          <div className="flex flex-col gap-4 mb-6 border-b border-sky-100 pb-5">
            <h3 className="text-lg md:text-xl font-black text-slate-800">
              {filter === '전체' ? `총 ${places.length}개의 리스트` : `'${filter}' 리스트 (${filteredPlaces.length}개)`}
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {FILTER_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${filter === cat ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredPlaces.length === 0 ? (
             <p className="text-center text-slate-400 py-20 italic">아직 등록된 리스트가 없습니다.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredPlaces.map(p => p.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 md:space-y-4">
                  {filteredPlaces.map((place) => <SortableItem key={place.id} place={place} getCategoryColor={getCategoryColor} handleEdit={handleEdit} handleDelete={handleDelete} />)}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </section>
    </div>
  );
};

export default ScheduleList;