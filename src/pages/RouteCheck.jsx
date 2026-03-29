import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, Marker, Polyline, InfoWindow } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = { lat: -33.8567844, lng: 151.2152967 }; // 기본값 (시드니)

export default function RouteCheck({ timeline, googleMapsLoaded }) {
  const availableDays = Object.keys(timeline || {}).filter(day => timeline[day].length > 0).sort();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const mapRef = useRef(null);

  const currentDay = availableDays[currentDayIndex];
  
  // 위치 정보(lat, lng)가 있는 항목만 필터링
  const items = currentDay ? timeline[currentDay].filter(item => item.location && item.location.lat && item.location.lng) : [];

  const fitBounds = useCallback(() => {
    if (!mapRef.current || items.length === 0 || !window.google) return;
    const bounds = new window.google.maps.LatLngBounds();
    items.forEach(item => bounds.extend({ lat: item.location.lat, lng: item.location.lng }));
    mapRef.current.fitBounds(bounds);
    
    // 항목이 1개일 때 너무 줌인되는 것 방지
    if (items.length === 1) {
      setTimeout(() => mapRef.current.setZoom(15), 100);
    }
  }, [items]);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    fitBounds();
  }, [fitBounds]);

  useEffect(() => {
    if (mapRef.current) fitBounds();
  }, [currentDayIndex, fitBounds]);

  if (availableDays.length === 0) {
    return (
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-sky-100 min-h-[500px] flex flex-col items-center justify-center text-slate-400 italic space-y-4">
        <span className="text-6xl">🗺️</span>
        <p className="text-lg font-bold">동선을 확인할 일정이 없어요.</p>
        <p className="text-sm">[일정 정리] 탭에서 위치가 포함된 일정을 추가해주세요!</p>
      </div>
    );
  }

  const formattedDate = new Date(currentDay).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
  const pathCoordinates = items.map(item => ({ lat: item.location.lat, lng: item.location.lng }));

  return (
    <div className="flex flex-col gap-4 md:gap-6 relative pb-20">
      
      {/* 상단 탭 */}
      <div className="flex items-center justify-between bg-white rounded-3xl shadow-sm border border-sky-100 p-3 md:p-4 sticky top-[100px] md:top-[136px] z-30">
        <button onClick={() => { setCurrentDayIndex(prev => Math.max(0, prev - 1)); setSelectedPlace(null); }} disabled={currentDayIndex === 0} className="px-2 md:px-4 py-2 text-xs md:text-sm font-bold text-sky-600 disabled:text-slate-300">◀ 이전</button>
        <div className="text-center">
          <h2 className="text-lg md:text-xl font-black text-sky-800">Day {currentDayIndex + 1}</h2>
          <span className="text-[10px] md:text-xs font-bold text-slate-400">{formattedDate}</span>
        </div>
        <button onClick={() => { setCurrentDayIndex(prev => Math.min(availableDays.length - 1, prev + 1)); setSelectedPlace(null); }} disabled={currentDayIndex === availableDays.length - 1} className="px-2 md:px-4 py-2 text-xs md:text-sm font-bold text-sky-600 disabled:text-slate-300">다음 ▶</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 h-auto lg:h-[600px] relative z-10">
        
        {/* 리스트 패널 */}
        <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 h-[300px] lg:h-auto">
          <h3 className="text-center text-sky-700 font-black mb-2 md:mb-4">📍 이동 순서</h3>
          
          {items.length === 0 ? (
             <p className="text-center text-slate-400 text-sm mt-10">위치가 지정된 일정이 없습니다.</p>
          ) : (
            <div className="relative border-l-2 border-sky-100 ml-4 space-y-4 md:space-y-6 pb-4">
              {items.map((item, idx) => (
                <div key={item.id} className="relative pl-4 md:pl-6 cursor-pointer" onClick={() => setSelectedPlace(item)}>
                  <div className={`absolute -left-[11px] md:-left-[13px] top-1 w-5 h-5 md:w-6 md:h-6 rounded-full font-black flex items-center justify-center text-[9px] md:text-[10px] shadow-sm ring-4 ring-white transition-colors ${selectedPlace?.id === item.id ? 'bg-rose-500 text-white' : 'bg-sky-500 text-white'}`}>
                    {idx + 1}
                  </div>
                  <div className={`border p-2 md:p-3 rounded-xl shadow-sm transition-colors ${selectedPlace?.id === item.id ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100 hover:border-sky-200'}`}>
                    <h4 className="font-bold text-slate-800 text-xs md:text-sm">{item.alias}</h4>
                    <p className="text-[9px] md:text-[10px] text-slate-400 truncate mt-1">{item.location.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 구글 맵 패널 (모바일에서도 안 깨지게 높이 조정) */}
        <div className="lg:col-span-2 bg-slate-100 rounded-3xl shadow-inner border border-sky-100 overflow-hidden relative h-[400px] lg:h-auto">
          {!googleMapsLoaded ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold">
              <div className="animate-spin text-4xl mb-4">🌍</div>
              <p>지도를 불러오는 중입니다...</p>
            </div>
          ) : (
            <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={13} onLoad={onLoad} options={{ disableDefaultUI: true, zoomControl: true }}>
              
              {/* 경로 선 그리기 */}
              {pathCoordinates.length > 1 && (
                <Polyline path={pathCoordinates} options={{ strokeColor: '#0ea5e9', strokeOpacity: 0.8, strokeWeight: 4, icons: [{ icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW }, offset: '100%', repeat: '100px' }] }} />
              )}

              {/* 마커 그리기 */}
              {items.map((item, idx) => (
                <Marker 
                  key={item.id} 
                  position={{ lat: item.location.lat, lng: item.location.lng }} 
                  onClick={() => setSelectedPlace(item)}
                  label={{ text: String(idx + 1), color: 'white', fontWeight: 'bold', fontSize: '12px' }}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    fillColor: selectedPlace?.id === item.id ? '#f43f5e' : '#0ea5e9',
                    fillOpacity: 1,
                    strokeColor: 'white',
                    strokeWeight: 2,
                    scale: 14,
                  }}
                />
              ))}

              {/* 마커 클릭 시 정보창 */}
              {selectedPlace && (
                <InfoWindow position={{ lat: selectedPlace.location.lat, lng: selectedPlace.location.lng }} onCloseClick={() => setSelectedPlace(null)}>
                  <div className="p-1 max-w-[200px]">
                    <h3 className="font-bold text-slate-800 text-sm mb-1">{selectedPlace.alias}</h3>
                    <p className="text-[10px] text-slate-500">{selectedPlace.location.address}</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          )}
        </div>
        
      </div>
    </div>
  );
}