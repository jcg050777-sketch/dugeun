import React, { useState, useMemo } from 'react';

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
};

const describeSector = (x, y, radius, startAngle, endAngle) => {
  if (endAngle - startAngle >= 359.9) {
    return ["M", x, y - radius, "A", radius, radius, 0, 1, 1, x - 0.01, y - radius, "Z"].join(" ");
  }
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", x, y, "L", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y, "Z"].join(" ");
};

const CHART_COLORS = ['#38bdf8', '#fbbf24', '#34d399', '#f472b6', '#a78bfa', '#fb923c', '#4ade80', '#f87171', '#818cf8', '#94a3b8'];

// ⭐️ props로 categories 받기
export default function ExpenseTrend({ timeline, exchangeRate, categories }) {
  const safeRate = exchangeRate || 1400;

  // ⭐️ 전역 카테고리 데이터에서 이름 배열만 추출
  const categoryNames = categories ? categories.map(c => c.name) : ['관광'];

  const [activeTab, setActiveTab] = useState('chart');

  const [chartMode, setChartMode] = useState('category');
  const [chartCategoryFilter, setChartCategoryFilter] = useState('전체');

  const [checkCategory, setCheckCategory] = useState('전체');
  const [checkStatus, setCheckStatus] = useState('전체');
  const [variance, setVariance] = useState(5);

  const allExpenses = useMemo(() => {
    const list = [];
    Object.keys(timeline).forEach(day => {
      timeline[day].forEach(item => {
        const cat = item.category || '기타';
        const alias = item.alias || '이름 없음';
        
        const exps = item.expenses && item.expenses.length > 0 
          ? item.expenses 
          : [{ amount: item.cost || 0, currency: 'USD', isConfirmed: false }];

        exps.forEach(ex => {
          const amt = parseFloat(ex.amount) || 0;
          const costKrw = (ex.currency || 'USD') === 'USD' ? amt * safeRate : amt;
          if (costKrw > 0) {
            list.push({ category: cat, alias: alias, cost: costKrw, isConfirmed: !!ex.isConfirmed });
          }
        });
      });
    });
    return list;
  }, [timeline, safeRate]);

  const chartData = useMemo(() => {
    let filtered = allExpenses;
    let grouped = {};

    if (chartMode === 'category') {
      filtered.forEach(ex => { grouped[ex.category] = (grouped[ex.category] || 0) + ex.cost; });
    } else {
      if (chartCategoryFilter !== '전체') {
        filtered = filtered.filter(ex => ex.category === chartCategoryFilter);
      }
      filtered.forEach(ex => { grouped[ex.alias] = (grouped[ex.alias] || 0) + ex.cost; });
    }

    const totalSum = Object.values(grouped).reduce((a, b) => a + b, 0);
    
    const result = Object.keys(grouped).map((key) => ({
      name: key,
      value: grouped[key],
      percentage: totalSum > 0 ? (grouped[key] / totalSum) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return result.map((item, idx) => ({ ...item, color: CHART_COLORS[idx % CHART_COLORS.length] }));
  }, [allExpenses, chartMode, chartCategoryFilter]);

  const checkData = useMemo(() => {
    let filtered = allExpenses;
    if (checkCategory !== '전체') filtered = filtered.filter(ex => ex.category === checkCategory);
    if (checkStatus === '확정') filtered = filtered.filter(ex => ex.isConfirmed);
    if (checkStatus === '예상') filtered = filtered.filter(ex => !ex.isConfirmed);

    let confirmedSum = 0;
    let expectedSum = 0;

    filtered.forEach(ex => {
      if (ex.isConfirmed) confirmedSum += ex.cost;
      else expectedSum += ex.cost;
    });

    const baseTotal = confirmedSum + expectedSum;
    const varianceAmount = expectedSum * (variance / 100);

    return {
      confirmedSum,
      expectedSum,
      baseTotal,
      minTotal: confirmedSum + (expectedSum - varianceAmount),
      maxTotal: confirmedSum + (expectedSum + varianceAmount),
      varianceAmount
    };
  }, [allExpenses, checkCategory, checkStatus, variance]);

  if (allExpenses.length === 0) {
    return (
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-sky-100 min-h-[500px] flex flex-col items-center justify-center text-slate-400 italic space-y-4">
        <span className="text-6xl">📈</span>
        <p className="text-lg font-bold">비용 추이를 분석할 데이터가 없어요.</p>
        <p className="text-sm">먼저 [비용 정리] 탭에서 금액을 입력해주세요!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative min-h-[600px]">
      
      <div className="w-full lg:w-64 shrink-0 bg-white rounded-3xl shadow-sm border border-sky-100 p-4 h-max sticky top-36 z-20">
        <h3 className="text-sm font-black text-slate-400 px-4 mb-4">대시보드 메뉴</h3>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setActiveTab('chart')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'chart' ? 'bg-sky-50 text-sky-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            <span className="text-lg">📊</span> 카테고리 별 차트
          </button>
          <button onClick={() => setActiveTab('check')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${activeTab === 'check' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            <span className="text-lg">🧾</span> 비용 체크 (편차)
          </button>
        </nav>
      </div>

      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-sky-100 p-8 relative z-10">
        
        {activeTab === 'chart' && (
          <div className="flex flex-col gap-8 flex-1">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h2 className="text-2xl font-black text-sky-800 flex items-center gap-2"><span>📊</span> 예산 분포 차트</h2>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-inner">
                <button onClick={() => setChartMode('category')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${chartMode === 'category' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>구분별</button>
                <button onClick={() => setChartMode('alias')} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${chartMode === 'alias' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>별칭별</button>
              </div>
            </div>

            {chartMode === 'alias' && (
              <div className="flex flex-wrap gap-2 mb-2 border-b border-sky-50 pb-6">
                <span className="text-xs font-bold text-slate-400 mt-2 mr-2">구분 필터:</span>
                {/* ⭐️ 동적 카테고리 적용 */}
                {categoryNames.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setChartCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${chartCategoryFilter === cat ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {chartData.length === 0 ? (
              <div className="py-20 text-center text-slate-400 font-bold">해당 조건에 맞는 지출 내역이 없습니다.</div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center justify-center gap-16 mt-4">
                
                <div className="relative w-[360px] h-[360px] shrink-0">
                  <div className="absolute inset-0 rounded-full border-[12px] border-slate-50 shadow-inner bg-white"></div>
                  <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
                    {(() => {
                      let currentAngle = 0;
                      return chartData.map((item) => {
                        const sliceAngle = (item.percentage / 100) * 360;
                        const startAngle = currentAngle;
                        const endAngle = currentAngle + sliceAngle;
                        currentAngle += sliceAngle;

                        const midAngle = (startAngle + endAngle) / 2;
                        const textPos = polarToCartesian(100, 100, 70, midAngle);
                        const showText = item.percentage > 8; 

                        return (
                          <g key={item.name}>
                            <path d={describeSector(100, 100, 100, startAngle, endAngle)} fill={item.color} stroke="white" strokeWidth="2" className="hover:opacity-80 transition-opacity cursor-pointer">
                              <title>{item.name} ({Math.round(item.value).toLocaleString()}원)</title>
                            </path>
                            {showText && (
                              <text x={textPos.x} y={textPos.y} fill="white" fontSize="8" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.6)' }}>
                                {`${item.name} / ${Math.round(item.percentage)}%`}
                              </text>
                            )}
                          </g>
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-[30%] rounded-full bg-white shadow-inner flex items-center justify-center flex-col z-20 border-8 border-slate-50">
                    <span className="text-xs font-bold text-slate-400">{chartMode === 'category' ? '전체 지출' : '상세 지출'}</span>
                    <span className="text-[10px] font-black text-sky-600 mt-1">{chartData.length}개 항목</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 min-w-[300px] w-full lg:w-auto max-h-[360px] overflow-y-auto custom-scrollbar pr-2">
                  <h4 className="font-black text-slate-700 border-b pb-2 border-slate-100 mb-2">지출 요약 (원화 기준)</h4>
                  {chartData.map(item => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors gap-6">
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: item.color }}></div>
                        <span className="font-bold text-sm text-slate-800 truncate">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0 flex flex-col">
                        <span className="text-sm font-black text-slate-700">{Math.round(item.value).toLocaleString()}원</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>
        )}

        {activeTab === 'check' && (
          <div className="flex flex-col gap-8 flex-1">
            <h2 className="text-2xl font-black text-indigo-800 flex items-center gap-2"><span>🧾</span> 보수적 비용 체크</h2>
            
            <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-2xl flex flex-col md:flex-row gap-6 md:items-end relative z-10">
              <div className="flex-1 space-y-4 relative z-20">
                <div className="flex items-center gap-4 relative z-30">
                  <label className="w-20 text-sm font-bold text-indigo-900">구분 필터</label>
                  <div className="flex flex-wrap gap-2 relative z-40">
                    {/* ⭐️ 동적 카테고리 적용 */}
                    {['전체', ...categoryNames].map(cat => (
                      <button key={cat} onClick={() => setCheckCategory(cat)} className={`px-3 py-1 rounded-md text-xs font-bold transition-all relative z-50 ${checkCategory === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 relative z-30">
                  <label className="w-20 text-sm font-bold text-indigo-900">상태 필터</label>
                  <div className="flex flex-wrap gap-2 relative z-40">
                    {['전체', '확정', '예상'].map(status => (
                      <button key={status} onClick={() => setCheckStatus(status)} className={`px-3 py-1 rounded-md text-xs font-bold transition-all relative z-50 ${checkStatus === status ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm shrink-0 w-full md:w-auto relative z-20">
                <label className="block text-xs font-bold text-slate-500 mb-2">예상 금액 편차 (±%)</label>
                <div className="flex items-center gap-2 relative z-30">
                  <input type="number" value={variance} onChange={e => setVariance(Number(e.target.value))} className="w-20 text-right bg-indigo-50 border border-indigo-200 p-2 rounded-lg text-lg font-black text-indigo-700 outline-none focus:border-indigo-500 relative z-40" />
                  <span className="font-bold text-slate-400">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">* 확정 금액에는 편차가 적용되지 않습니다.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4 relative z-0">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-emerald-200 rounded-3xl p-6 shadow-sm flex flex-col justify-center text-center">
                <h4 className="text-sm font-bold text-emerald-700 mb-2">최소 예상액 (Min -{variance}%)</h4>
                <p className="text-3xl font-black text-emerald-600">{Math.round(checkData.minTotal).toLocaleString()}<span className="text-lg ml-1">원</span></p>
                <p className="text-[10px] font-bold text-emerald-500 mt-3 pt-3 border-t border-emerald-200/50">예상 금액에서 {Math.round(checkData.varianceAmount).toLocaleString()}원이 절감된 결과</p>
              </div>

              <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-center text-center">
                <h4 className="text-sm font-bold text-slate-500 mb-2">현재 예상 총액 (Base)</h4>
                <p className="text-3xl font-black text-slate-800">{Math.round(checkData.baseTotal).toLocaleString()}<span className="text-lg ml-1">원</span></p>
                <div className="mt-4 flex justify-between text-xs font-bold bg-slate-50 p-2 rounded-lg">
                  <span className="text-emerald-600">확정: {Math.round(checkData.confirmedSum).toLocaleString()}</span>
                  <span className="text-slate-400">예상: {Math.round(checkData.expectedSum).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-3xl p-6 shadow-sm flex flex-col justify-center text-center">
                <h4 className="text-sm font-bold text-red-700 mb-2">최대 예상액 (Max +{variance}%)</h4>
                <p className="text-3xl font-black text-red-600">{Math.round(checkData.maxTotal).toLocaleString()}<span className="text-lg ml-1">원</span></p>
                <p className="text-[10px] font-bold text-red-500 mt-3 pt-3 border-t border-red-200/50">예상 금액에서 {Math.round(checkData.varianceAmount).toLocaleString()}원이 초과된 결과</p>
              </div>
            </div>
            
            <div className="bg-indigo-50/50 text-indigo-800 text-sm font-bold p-4 rounded-xl text-center mt-2 border border-indigo-100">
              💡 <span className="text-indigo-600">Tip:</span> 예산은 항상 <strong>최대 예상액(Max)</strong> 기준으로 넉넉하게 준비하는 것이 안전합니다!
            </div>
          </div>
        )}

      </div>
    </div>
  );
}