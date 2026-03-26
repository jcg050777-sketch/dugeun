import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Marker, Polyline } from '@react-google-maps/api'; // ⭐️ useJsApiLoader 삭제

// ⭐️ API 키, libraries 설정 삭제

const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '1.5rem' };
const defaultCenter = { lat: -33.8688, lng: 151.2093 }; 

// ⭐️ googleMapsLoaded를 props로 받음
export default function RouteCheck({ timeline, googleMapsLoaded }) {
  const availableDays = Object.keys(timeline).filter(day => timeline[day].length > 0).sort();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const mapRef = useRef(null);

  // ⭐️ 기존 useJsApiLoader 로직 삭제

  const currentDay = availableDays[currentDayIndex];
  const items = currentDay ? timeline[currentDay] : [];

  const validItems = items.filter(item => item.location && item.location.lat && item.location.lng);
  const pathCoordinates = validItems.map(item => ({ lat: item.location.lat, lng: item.location.lng }));

  const onLoad = useCallback(function callback(map) { mapRef.current = map; }, []);
  const onUnmount = useCallback(function callback(map) { mapRef.current = null; }, []);

  useEffect(() => {
    if (mapRef.current && pathCoordinates.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      pathCoordinates.forEach(coord => bounds.extend(coord));
      mapRef.current.fitBounds(bounds);
      
      if (pathCoordinates.length === 1) {
        const listener = window.google.maps.event.addListener(mapRef.current, "idle", function() { 
          if (mapRef.current.getZoom() > 15) mapRef.current.setZoom(15); 
          window.google.maps.event.removeListener(listener); 
        });
      }
    } else if (mapRef.current) {
      mapRef.current.panTo(defaultCenter);
      mapRef.current.setZoom(12);
    }
  }, [pathCoordinates, currentDayIndex]);

  if (availableDays.length === 0) {
    return (
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-sky-100 min-h-[500px] flex flex-col items-center justify-center text-slate-400 italic space-y-4">
        <span className="text-6xl">🗺️</span>
        <p className="text-lg font-bold">동선을 확인할 일정이 없어요.</p>
        <p className="text-sm">먼저 일정을 등록해주세요!</p>
      </div>
    );
  }

  const formattedDate = new Date(currentDay).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });

  return (
    <div className="flex flex-col gap-6 relative pb-20">
      
      <div className="flex items-center justify-between bg-white rounded-3xl shadow-sm border border-sky-100 p-4 sticky top-48 z-20"> {/* ⭐️ top 위치 조절 */}
        <button onClick={() => setCurrentDayIndex(prev => Math.max(0, prev - 1))} disabled={currentDayIndex === 0} className="px-4 py-2 text-sm font-bold text-sky-600 disabled:text-slate-300">◀ 이전</button>
        <div className="text-center">
          <h2 className="text-xl font-black text-sky-800">Day {currentDayIndex + 1}</h2>
          <span className="text-xs font-bold text-slate-400">{formattedDate}</span>
        </div>
        <button onClick={() => setCurrentDayIndex(prev => Math.min(availableDays.length - 1, prev + 1))} disabled={currentDayIndex === availableDays.length - 1} className="px-4 py-2 text-sm font-bold text-sky-600 disabled:text-slate-300">다음 ▶</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4">
          <h3 className="text-center text-sky-700 font-black mb-4">📍 이동 순서</h3>
          {validItems.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-10 font-bold bg-slate-50 rounded-xl">위치가 지정된 일정이 없습니다.</div>
          ) : (
            <div className="relative border-l-2 border-sky-100 ml-4 space-y-6 pb-4">
              {validItems.map((item, idx) => (
                <div key={item.id} className="relative pl-6">
                  <div className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-sky-500 text-white font-black flex items-center justify-center text-[10px] shadow-sm ring-4 ring-white">{idx + 1}</div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-sky-600 transition-colors">{item.alias}</h4>
                    <p className="text-[10px] text-slate-400 truncate mt-1">{item.location.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-slate-100 rounded-3xl shadow-inner border border-sky-100 overflow-hidden relative">
          {/* ⭐️ props로 받은 googleMapsLoaded 사용 */}
          {!googleMapsLoaded ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold">지도 불러오는 중...</div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={pathCoordinates.length > 0 ? pathCoordinates[0] : defaultCenter}
              zoom={12}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{ disableDefaultUI: true, zoomControl: true }}
            >
              {validItems.map((item, idx) => (
                <Marker key={item.id} position={{ lat: item.location.lat, lng: item.location.lng }} label={{ text: String(idx + 1), color: 'white', fontWeight: 'bold' }} />
              ))}
              {pathCoordinates.length > 1 && (
                <Polyline path={pathCoordinates} options={{ strokeColor: '#0ea5e9', strokeOpacity: 0.8, strokeWeight: 4 }} />
              )}
            </GoogleMap>
          )}
        </div>
      </div>
    </div>
  );
}