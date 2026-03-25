import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';

// ⭐️ 여기에 발급받은 구글맵 API 키를 넣어주세요!
const GOOGLE_MAPS_API_KEY = "AIzaSyB_p8m24A0KrDtyh4RKwTaMVm5jHisEcD8";

// ⭐️ 충돌 해결의 핵심! ScheduleList랑 똑같이 'places' 라이브러리를 부르도록 설정
const libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1.5rem' // 24px
};

const defaultCenter = { lat: -33.8688, lng: 151.2093 };

export default function RouteCheck({ timeline }) {
  // ⭐️ 여기에 libraries 옵션 추가됨
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const mapRef = useRef(null);
  const [activeMarker, setActiveMarker] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const availableDays = Object.keys(timeline).filter(day => timeline[day].length > 0).sort();
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  const currentDayStr = availableDays[currentDayIndex];
  const currentItems = currentDayStr ? timeline[currentDayStr] : [];

  // 위치가 없으면 이전 일자의 위치를 따라가는(상속) 로직
  const markers = [];
  let lastKnownLocation = null;
  let orderCounter = 1;

  currentItems.forEach((item) => {
    let itemLocation = null;

    if (item.location && item.location.lat && item.location.lng) {
      itemLocation = item.location;
      lastKnownLocation = item.location; // 최신 위치 업데이트
    } else if (lastKnownLocation) {
      itemLocation = lastKnownLocation; // 위치가 없으면 이전 위치 복사
    }

    if (itemLocation) {
      markers.push({
        id: item.id,
        alias: item.alias,
        lat: itemLocation.lat,
        lng: itemLocation.lng,
        order: orderCounter++,
        startTime: item.startTime,
        duration: item.duration,
        inputType: item.inputType
      });
    }
  });

  const polylinePositions = markers.map(m => ({ lat: m.lat, lng: m.lng }));

  const onLoad = useCallback(function callback(map) {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(function callback(map) {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (showMap && mapRef.current && markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(({ lat, lng }) => bounds.extend({ lat, lng }));
      mapRef.current.fitBounds(bounds);
      
      if (markers.length === 1) {
        setTimeout(() => mapRef.current.setZoom(15), 100);
      }
    }
  }, [markers, currentDayIndex, isLoaded, showMap]);

  const handlePrevDay = () => {
    if (currentDayIndex > 0) setCurrentDayIndex(prev => prev - 1);
    setActiveMarker(null);
  };

  const handleNextDay = () => {
    if (currentDayIndex < availableDays.length - 1) setCurrentDayIndex(prev => prev + 1);
    setActiveMarker(null);
  };

  if (availableDays.length === 0) {
    return (
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-sky-100 min-h-[500px] flex flex-col items-center justify-center text-slate-400 italic space-y-4">
        <span className="text-6xl">🗺️</span>
        <p className="text-lg font-bold">아직 정리된 일정이 없어요.</p>
        <p className="text-sm">[일정 정리] 탭에서 타임라인에 일정을 먼저 추가해주세요!</p>
      </div>
    );
  }

  const formattedDate = new Date(currentDayStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  return (
    <div className="flex flex-col gap-6 relative h-[calc(100vh-150px)]">
      
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-sky-100 flex items-center justify-between shrink-0">
        <button onClick={handlePrevDay} disabled={currentDayIndex === 0} className={`px-4 py-2 rounded-xl font-black text-lg transition-colors ${currentDayIndex === 0 ? 'text-slate-200 cursor-not-allowed' : 'text-sky-600 hover:bg-sky-50'}`}>
          ◀ 이전 날짜
        </button>
        <div className="text-center">
          <h2 className="text-2xl font-black text-sky-700">Day {currentDayIndex + 1}</h2>
          <p className="text-sm font-bold text-slate-400">{formattedDate}</p>
        </div>
        <button onClick={handleNextDay} disabled={currentDayIndex === availableDays.length - 1} className={`px-4 py-2 rounded-xl font-black text-lg transition-colors ${currentDayIndex === availableDays.length - 1 ? 'text-slate-200 cursor-not-allowed' : 'text-sky-600 hover:bg-sky-50'}`}>
          다음 날짜 ▶
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
        
        <div className="lg:col-span-1 bg-white rounded-3xl shadow-sm border border-sky-100 flex flex-col overflow-hidden">
          <h3 className="bg-sky-50 text-sky-800 font-bold p-4 text-center border-b border-sky-100 shrink-0">📍 이동 순서</h3>
          <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-4">
            {markers.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-10">위치 정보가 있는 일정이 없어요.</p>
            ) : (
              markers.map((marker, idx) => (
                <div key={marker.id} className="flex gap-3 relative cursor-pointer group" onClick={() => { if(showMap) setActiveMarker(marker); }}>
                  {idx !== markers.length - 1 && <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-sky-200"></div>}
                  <div className="w-6 h-6 rounded-full bg-sky-600 text-white font-black flex items-center justify-center shrink-0 text-xs border-2 border-white shadow-sm z-10 group-hover:bg-sky-500 transition-colors">
                    {marker.order}
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex-1 shadow-sm group-hover:border-sky-300 transition-colors">
                    <p className="font-bold text-slate-800 text-sm">{marker.alias}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {marker.inputType === '시간' ? `${marker.duration || 0}시간 소요` : '시각 지정됨'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-slate-100 rounded-3xl shadow-sm border border-sky-100 overflow-hidden relative z-0 flex items-center justify-center min-h-[400px]">
          
          {!showMap ? (
            <div className="flex flex-col items-center justify-center w-full h-full bg-sky-50/30 text-center p-6">
              <span className="text-6xl mb-4">🗺️</span>
              <h3 className="text-xl font-black text-slate-700 mb-2">지도가 꺼져있습니다</h3>
              <p className="text-sm font-bold text-slate-400 mb-6">데이터 및 API 호출 비용 절약을 위해 지도를 숨겨두었습니다.<br/>동선을 시각적으로 확인하려면 아래 버튼을 눌러주세요.</p>
              <button 
                onClick={() => setShowMap(true)} 
                className="bg-sky-600 text-white px-8 py-3 rounded-xl font-black text-lg hover:bg-sky-700 shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                <span>📍</span> 지도 켜기 (동선 확인)
              </button>
            </div>
          ) : (
            <div className="w-full h-full relative">
              <button 
                onClick={() => {
                  setShowMap(false);
                  setActiveMarker(null);
                }} 
                className="absolute top-4 left-4 z-[100] bg-white text-slate-600 px-4 py-2 rounded-lg text-sm font-black shadow-lg border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-2"
              >
                <span>❌</span> 지도 끄기
              </button>

              {!isLoaded ? (
                <div className="flex h-full items-center justify-center text-sky-600 font-bold animate-pulse">구글 맵 불러오는 중...</div>
              ) : (
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={defaultCenter}
                  zoom={13}
                  onLoad={onLoad}
                  onUnmount={onUnmount}
                  options={{ disableDefaultUI: true, zoomControl: true }}
                >
                  {markers.map(marker => (
                    <Marker
                      key={marker.id}
                      position={{ lat: marker.lat, lng: marker.lng }}
                      label={{ text: String(marker.order), color: 'white', fontWeight: 'bold' }}
                      onClick={() => setActiveMarker(marker)}
                    />
                  ))}

                  {polylinePositions.length > 1 && (
                    <Polyline 
                      path={polylinePositions} 
                      options={{ strokeColor: '#0284c7', strokeOpacity: 0.8, strokeWeight: 4 }} 
                    />
                  )}

                  {activeMarker && (
                    <InfoWindow 
                      position={{ lat: activeMarker.lat, lng: activeMarker.lng }} 
                      onCloseClick={() => setActiveMarker(null)}
                    >
                      <div className="p-1 text-center font-bold text-sky-800">
                        <span className="bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full text-[10px] mr-1">#{activeMarker.order}</span>
                        {activeMarker.alias}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}