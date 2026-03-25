import React, { useRef, useState } from 'react';

export default function BackupRestore({ places, setPlaces, timeline, setTimeline, exchangeRate, setExchangeRate, categories, setCategories }) {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState({ type: '', message: '' });

  // 다운로드 (백업)
  const handleDownload = () => {
    try {
      const data = {
        places,
        timeline,
        exchangeRate,
        categories
      };
      
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      
      // 파일명에 현재 날짜 포함
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `dugeun_backup_${dateStr}.json`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setStatus({ type: 'success', message: '✅ 백업 파일이 성공적으로 다운로드되었습니다!' });
      setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    } catch (error) {
      setStatus({ type: 'error', message: '❌ 백업 중 오류가 발생했습니다.' });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 업로드 (복구)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // 데이터 구조 간단 유효성 검사
        if (data.places && data.timeline && data.categories) {
          if(window.confirm('⚠️ 복구를 진행하면 현재 작업 중인 모든 데이터가 덮어씌워집니다. 진행하시겠습니까?')) {
            setPlaces(data.places);
            setTimeline(data.timeline);
            if (data.exchangeRate) setExchangeRate(data.exchangeRate);
            if (data.categories) setCategories(data.categories);
            
            setStatus({ type: 'success', message: '✅ 데이터 복구가 완벽하게 완료되었습니다!' });
          }
        } else {
          setStatus({ type: 'error', message: '❌ Dugeun(두근) 전용 백업 파일 형식이 아닙니다.' });
        }
      } catch (error) {
        setStatus({ type: 'error', message: '❌ 파일을 읽는 중 오류가 발생했습니다. (잘못된 JSON 형식)' });
      }
      // input 초기화
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 pb-20">
      <div className="bg-white p-12 rounded-3xl shadow-lg border border-sky-100 flex flex-col items-center">
        
        <span className="text-[80px] block mb-4">💾</span>
        <h2 className="text-3xl font-black text-slate-800 mb-4">데이터 백업 및 복구</h2>
        <p className="text-slate-500 font-bold mb-10 text-center leading-relaxed">
          작성하신 소중한 여행 일정, 비용, 카테고리 등 모든 설정을 <br className="hidden md:block"/>
          하나의 <code className="bg-slate-100 px-2 py-0.5 rounded text-sky-600 font-black">.json</code> 파일로 안전하게 저장하고 언제든지 다시 불러올 수 있습니다.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl">
          
          {/* 백업 카드 */}
          <div className="bg-sky-50/40 border-2 border-sky-100 rounded-3xl p-8 flex flex-col items-center hover:border-sky-300 transition-colors shadow-sm group">
            <div className="w-20 h-20 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform">⬇️</div>
            <h3 className="text-xl font-black text-sky-800 mb-2">PC에 백업하기</h3>
            <p className="text-xs font-bold text-slate-400 text-center mb-8 h-8">현재까지 작업한 모든 데이터를<br/>로컬 컴퓨터에 다운로드합니다.</p>
            <button 
              onClick={handleDownload} 
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-95"
            >
              백업 파일 다운로드
            </button>
          </div>

          {/* 복구 카드 */}
          <div className="bg-indigo-50/40 border-2 border-indigo-100 rounded-3xl p-8 flex flex-col items-center hover:border-indigo-300 transition-colors shadow-sm group">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:scale-110 transition-transform">⬆️</div>
            <h3 className="text-xl font-black text-indigo-800 mb-2">백업 파일 불러오기</h3>
            <p className="text-xs font-bold text-slate-400 text-center mb-8 h-8">저장해둔 .json 파일을 선택하여<br/>이전 상태로 복구합니다.</p>
            
            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            
            <button 
              onClick={handleUploadClick} 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-md transition-all active:scale-95"
            >
              파일 선택 및 복구
            </button>
          </div>

        </div>

        {/* 상태 메시지 알림창 */}
        {status.message && (
          <div className={`mt-10 p-4 px-8 rounded-2xl font-black text-sm text-center shadow-sm animate-fade-in-up ${status.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
            {status.message}
          </div>
        )}
        
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-12 w-full max-w-2xl">
          <p className="text-xs text-slate-500 font-bold flex items-start gap-2 leading-relaxed">
            <span className="text-lg leading-none">⚠️</span>
            <span>
              <strong>주의사항:</strong> 백업 파일을 불러오면 현재 작성 중인 모든 데이터가 즉시 덮어씌워집니다. <br/>
              복구(업로드)를 진행하기 전에 안전을 위해 현재 상태를 먼저 백업(다운로드)하는 것을 권장합니다.
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}