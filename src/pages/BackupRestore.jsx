import React, { useRef } from 'react';

export default function BackupRestore({ places, setPlaces, timeline, setTimeline, exchangeRate, setExchangeRate, categories, setCategories }) {
  const fileInputRef = useRef(null);

  const handleBackup = async () => {
    const data = {
      places,
      timeline,
      exchangeRate,
      categories,
      prepareItems: JSON.parse(localStorage.getItem('dugeun_prepare_items') || '[]'),
      deadlineItems: JSON.parse(localStorage.getItem('dugeun_deadline_items') || '[]'),
      outfits: JSON.parse(localStorage.getItem('dugeun_outfits') || '{}'),
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const defaultFilename = `dugeun_backup_${new Date().toISOString().split('T')[0]}.json`;

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultFilename,
          types: [{
            description: 'JSON 백업 파일',
            accept: { 'application/json': ['.json'] },
          }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        alert('✅ 원하는 경로에 데이터 백업이 완료되었습니다!');
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('SaveFilePicker 에러:', err);
          fallbackDownload(blob, defaultFilename);
        }
        return;
      }
    } else {
      fallbackDownload(blob, defaultFilename);
    }
  };

  const fallbackDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('✅ 백업 파일이 기본 다운로드 폴더에 저장되었습니다!');
  };

  const handleRestore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        if (parsed.places) setPlaces(parsed.places);
        if (parsed.timeline) setTimeline(parsed.timeline);
        if (parsed.exchangeRate) setExchangeRate(parsed.exchangeRate);
        if (parsed.categories) setCategories(parsed.categories);

        if (parsed.prepareItems) localStorage.setItem('dugeun_prepare_items', JSON.stringify(parsed.prepareItems));
        if (parsed.deadlineItems) localStorage.setItem('dugeun_deadline_items', JSON.stringify(parsed.deadlineItems));
        if (parsed.outfits) localStorage.setItem('dugeun_outfits', JSON.stringify(parsed.outfits));

        alert('✅ 모든 데이터가 완벽하게 복구되었습니다! 안전을 위해 페이지를 새로고침합니다.');
        window.location.reload(); 
      } catch (error) {
        alert('❌ 파일 형식이 잘못되었거나 손상되었습니다. 올바른 백업 파일을 선택해주세요.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  return (
    // ⭐️ 기존 py-10 md:py-20 였던 여백을 mt-4 md:mt-8 로 대폭 줄여서 위로 당겨줌!
    <div className="flex flex-col items-center mt-4 md:mt-8 pb-20">
      <div className="bg-white rounded-3xl shadow-lg border border-sky-100 p-8 md:p-12 max-w-2xl w-full text-center">
        <span className="text-6xl md:text-8xl block mb-6">💾</span>
        <h2 className="text-2xl md:text-3xl font-black text-sky-800 mb-4">데이터 백업 및 복구</h2>
        <p className="text-sm md:text-base font-bold text-slate-500 mb-10 leading-relaxed">
          작성하신 소중한 여행 일정, 비용, 준비물, 코디 등 모든 설정을<br/>
          하나의 <span className="bg-sky-100 text-sky-700 px-2 py-0.5 rounded-md">.json</span> 파일로 안전하게 저장하고 언제든지 다시 불러올 수 있습니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-6 flex flex-col items-center gap-4 hover:border-sky-300 transition-colors">
            <span className="w-12 h-12 bg-sky-200 text-sky-700 rounded-full flex items-center justify-center text-xl font-black mb-2">⬇️</span>
            <h3 className="text-lg font-black text-slate-800">PC/모바일에 백업하기</h3>
            <p className="text-xs text-slate-400 font-bold mb-4">현재까지 작업한 모든 데이터를<br/>원하는 경로에 파일로 저장합니다.</p>
            <button onClick={handleBackup} className="w-full bg-sky-600 text-white font-black py-3 rounded-xl shadow-sm hover:bg-sky-700 transition-colors">
              백업 파일 다운로드
            </button>
          </div>

          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 flex flex-col items-center gap-4 hover:border-indigo-300 transition-colors">
            <span className="w-12 h-12 bg-indigo-200 text-indigo-700 rounded-full flex items-center justify-center text-xl font-black mb-2">⬆️</span>
            <h3 className="text-lg font-black text-slate-800">백업 파일 불러오기</h3>
            <p className="text-xs text-slate-400 font-bold mb-4">저장해둔 .json 파일을 선택하여<br/>이전 상태로 완벽하게 복구합니다.</p>
            <button onClick={() => fileInputRef.current.click()} className="w-full bg-indigo-600 text-white font-black py-3 rounded-xl shadow-sm hover:bg-indigo-700 transition-colors">
              파일 선택 및 복구
            </button>
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleRestore} />
          </div>
        </div>
      </div>
    </div>
  );
}