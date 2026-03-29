import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useJsApiLoader } from '@react-google-maps/api';

import ScheduleList from './pages/ScheduleList';
import ScheduleEdit from './pages/ScheduleEdit';
import RouteCheck from './pages/RouteCheck';
import ScheduleCheck from './pages/ScheduleCheck';
import SchedulePrepare from './pages/SchedulePrepare';

import ExpenseTotal from './pages/ExpenseTotal'; 
import TransportCalc from './pages/TransportCalc';
import ExpenseTrend from './pages/ExpenseTrend'; 
import CategoryManage from './pages/CategoryManage';
import BackupRestore from './pages/BackupRestore';

const GOOGLE_MAPS_API_KEY = "AIzaSyB_p8m24A0KrDtyh4RKwTaMVm5jHisEcD8";
const libraries = ['places'];

const Navigation = () => {
  const location = useLocation();
  const path = location.pathname;
  
  let activeMain = '여행 일정';
  if (path.startsWith('/expense')) activeMain = '여행 비용';
  if (path.startsWith('/advanced')) activeMain = '고급';

  return (
    <>
      <header className="border-b border-sky-100 bg-white px-4 md:px-10 h-16 md:h-20 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4 md:gap-16 w-full">
          <Link to="/" className="text-xl md:text-3xl font-black text-sky-600 tracking-tighter shrink-0">Dugeun 💓</Link>
          
          <nav className="flex gap-6 md:gap-10 text-sm md:text-lg font-bold mt-2 overflow-x-auto whitespace-nowrap custom-scrollbar flex-1 pb-1">
            <Link to="/" className={activeMain === '여행 일정' ? "text-sky-600 border-b-4 border-sky-600 pb-3 md:pb-5" : "text-slate-400 hover:text-slate-600 pb-3 md:pb-5"}>여행 일정</Link>
            <Link to="/expense/total" className={activeMain === '여행 비용' ? "text-sky-600 border-b-4 border-sky-600 pb-3 md:pb-5" : "text-slate-400 hover:text-slate-600 pb-3 md:pb-5"}>여행 비용</Link>
            {/* ⭐️ 모바일에서도 보이게 수정! 이름도 '데이터 세팅'으로 직관적으로 변경 */}
            <Link to="/advanced/backup" className={activeMain === '고급' ? "text-sky-600 border-b-4 border-sky-600 pb-3 md:pb-5" : "text-slate-400 hover:text-slate-600 pb-3 md:pb-5"}>데이터 세팅</Link>
          </nav>
        </div>
      </header>

      <div className="bg-[#f8fbff] border-b border-sky-50 px-4 md:px-10 py-3 md:py-4 sticky top-16 md:top-20 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex gap-6 md:gap-10 text-[13px] md:text-[15px] font-bold overflow-x-auto whitespace-nowrap custom-scrollbar pb-1">
          {activeMain === '여행 일정' && (
            <>
              {/* 편집 관련 탭은 PC(md 이상)에서만 보이게 처리 */}
              <Link to="/" className={`hidden md:block ${path === '/' ? "text-sky-700" : "text-slate-400 hover:text-sky-700"}`}>일정 리스트</Link>
              <Link to="/schedule/edit" className={`hidden md:block ${path === '/schedule/edit' ? "text-sky-700" : "text-slate-400 hover:text-sky-700"}`}>일정 정리</Link>
              
              <Link to="/schedule/check" className={path === '/schedule/check' ? "text-sky-700" : "text-slate-400 hover:text-sky-700"}>일정 체크</Link>
              <Link to="/schedule/route" className={path === '/schedule/route' ? "text-sky-700" : "text-slate-400 hover:text-sky-700"}>동선 체크</Link>
              <Link to="/schedule/prepare" className={path === '/schedule/prepare' ? "text-sky-700" : "text-slate-400 hover:text-sky-700"}>일정 준비</Link>
            </>
          )}
          {activeMain === '여행 비용' && (
            <>
              <Link to="/expense/total" className={path === '/expense/total' ? "text-sky-700" : "text-slate-400 hover:text-sky-700"}>비용 정리</Link>
              <Link to="/expense/transport" className={path === '/expense/transport' ? "text-sky-700" : "text-slate-400 hover:text-sky-700"}>교통비 계산</Link>
              <Link to="/expense/trend" className={`hidden md:block ${path === '/expense/trend' ? "text-sky-700" : "text-slate-400 hover:text-sky-700"}`}>비용 추이</Link>
            </>
          )}
          {activeMain === '고급' && (
            <>
              <Link to="/advanced/backup" className={path === '/advanced/backup' ? "text-sky-700" : "text-slate-400 hover:text-sky-700"}>백업 / 복구</Link>
              <Link to="/advanced/category" className={`hidden md:block ${path === '/advanced/category' ? "text-sky-700" : "text-slate-400 hover:text-sky-700"}`}>구분 추가</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const getInitialData = (key, initialValue) => {
  const storedData = localStorage.getItem(key);
  if (storedData) {
    try { return JSON.parse(storedData); } catch (e) { return initialValue; }
  }
  return initialValue;
};

function App() {
  const [places, setPlaces] = useState(() => getInitialData('dugeun_places', [
    { id: '1', alias: '오페라 하우스', category: '관광', content: '외부 사진 촬영', location: { name: '시드니 오페라 하우스', address: 'Bennelong Point, Sydney NSW 2000 오스트레일리아', lat: -33.8567844, lng: 151.2152967 } },
  ]));
  const [timeline, setTimeline] = useState(() => getInitialData('dugeun_timeline', {}));
  const [exchangeRate, setExchangeRate] = useState(() => getInitialData('dugeun_exchangeRate', 1400)); 
  const [categories, setCategories] = useState(() => getInitialData('dugeun_categories', [
    { id: 'cat_1', name: '체험' }, { id: 'cat_2', name: '식당' }, { id: 'cat_3', name: '교통' }, { id: 'cat_4', name: '관광' }, { id: 'cat_5', name: '기타' }
  ]));

  const { isLoaded: googleMapsLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  useEffect(() => { localStorage.setItem('dugeun_places', JSON.stringify(places)); }, [places]);
  useEffect(() => { localStorage.setItem('dugeun_timeline', JSON.stringify(timeline)); }, [timeline]);
  useEffect(() => { localStorage.setItem('dugeun_exchangeRate', JSON.stringify(exchangeRate)); }, [exchangeRate]);
  useEffect(() => { localStorage.setItem('dugeun_categories', JSON.stringify(categories)); }, [categories]);

  return (
    <Router>
      <div className="min-h-screen bg-[#fcfdff] text-slate-900 font-sans pb-20 relative">
        <Navigation />
        <main className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
          <Routes>
            <Route path="/" element={<ScheduleList places={places} setPlaces={setPlaces} timeline={timeline} setTimeline={setTimeline} categories={categories} googleMapsLoaded={googleMapsLoaded} />} />
            <Route path="/schedule/edit" element={<ScheduleEdit places={places} timeline={timeline} setTimeline={setTimeline} />} />
            <Route path="/schedule/route" element={<RouteCheck timeline={timeline} googleMapsLoaded={googleMapsLoaded} />} />
            <Route path="/schedule/check" element={<ScheduleCheck timeline={timeline} />} />
            <Route path="/schedule/prepare" element={<SchedulePrepare />} />
            
            <Route path="/expense/total" element={<ExpenseTotal timeline={timeline} setTimeline={setTimeline} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} />} />
            <Route path="/expense/transport" element={<TransportCalc timeline={timeline} exchangeRate={exchangeRate} />} />
            <Route path="/expense/trend" element={<ExpenseTrend timeline={timeline} exchangeRate={exchangeRate} categories={categories} />} />
            <Route path="/advanced/category" element={<CategoryManage categories={categories} setCategories={setCategories} />} />
            <Route path="/advanced/backup" element={<BackupRestore places={places} setPlaces={setPlaces} timeline={timeline} setTimeline={setTimeline} exchangeRate={exchangeRate} setExchangeRate={setExchangeRate} categories={categories} setCategories={setCategories} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;