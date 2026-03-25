import React from 'react';

export default function ExpenseTotal({ timeline, setTimeline, exchangeRate, setExchangeRate }) {
  const availableDays = Object.keys(timeline).filter(day => timeline[day].length > 0).sort();
  const safeRate = exchangeRate || 1400;

  const handleUpdateExpense = (dayStr, itemId, expId, field, value, isPlaceholder) => {
    setTimeline(prev => {
      const dayItems = prev[dayStr] || [];
      const newDayItems = dayItems.map(item => {
        if (item.id !== itemId) return item;

        let expenses = item.expenses || [];
        if (isPlaceholder || expenses.length === 0) {
          expenses = [{ id: expId, desc: '', amount: item.cost || '', isConfirmed: false, currency: 'USD' }];
        }
        
        const newExpenses = expenses.map(ex => ex.id === expId ? { ...ex, [field]: value } : ex);
        return { ...item, expenses: newExpenses, cost: undefined };
      });
      return { ...prev, [dayStr]: newDayItems };
    });
  };

  const handleAddExpense = (dayStr, itemId) => {
    setTimeline(prev => {
      const dayItems = prev[dayStr] || [];
      const newDayItems = dayItems.map(item => {
        if (item.id !== itemId) return item;
        const expenses = item.expenses || [];
        const currentExpenses = expenses.length > 0 ? expenses : [{ id: `init_${item.id}`, desc: '', amount: item.cost || '', isConfirmed: false, currency: 'USD' }];
        
        return { 
          ...item, 
          expenses: [...currentExpenses, { id: `exp_${Date.now()}_${Math.floor(Math.random()*1000)}`, desc: '', amount: '', isConfirmed: false, currency: 'USD' }] 
        };
      });
      return { ...prev, [dayStr]: newDayItems };
    });
  };

  const handleRemoveExpense = (dayStr, itemId, expId) => {
    setTimeline(prev => {
      const dayItems = prev[dayStr] || [];
      const newDayItems = dayItems.map(item => {
        if (item.id !== itemId) return item;
        return { ...item, expenses: (item.expenses || []).filter(ex => ex.id !== expId) };
      });
      return { ...prev, [dayStr]: newDayItems };
    });
  };

  const handleSyncExpenses = (sourceItemId, targetAlias) => {
    if (!window.confirm(`'${targetAlias}' 일정이 포함된 모든 날짜에 현재 비용 내역을 똑같이 덮어씌울까요?`)) return;
    setTimeline(prev => {
      let sourceExpenses = [];
      for (const day of Object.keys(prev)) {
        const found = prev[day].find(i => i.id === sourceItemId);
        if (found) {
          sourceExpenses = found.expenses || [];
          if (sourceExpenses.length === 0 && found.cost) sourceExpenses = [{ id: `sync_init`, desc: '', amount: found.cost, isConfirmed: false, currency: 'USD' }];
          break;
        }
      }
      const newTimeline = { ...prev };
      for (const day of Object.keys(newTimeline)) {
        newTimeline[day] = newTimeline[day].map(item => {
          if (item.alias === targetAlias && item.id !== sourceItemId) {
            const copiedExpenses = sourceExpenses.map(ex => ({ ...ex, id: `exp_sync_${Date.now()}_${Math.floor(Math.random()*10000)}` }));
            return { ...item, expenses: copiedExpenses, cost: undefined };
          }
          return item;
        });
      }
      return newTimeline;
    });
    alert('✅ 동일한 모든 일정에 비용이 일괄 적용되었습니다!');
  };

  const calculateTotalCost = () => {
    let totalKrw = 0;
    availableDays.forEach(day => {
      timeline[day].forEach(item => {
        if (item.category === '교통') return;
        if (item.expenses && item.expenses.length > 0) {
          item.expenses.forEach(ex => { 
            const amt = parseFloat(ex.amount) || 0;
            totalKrw += (ex.currency || 'USD') === 'USD' ? amt * safeRate : amt; 
          });
        } else if (item.cost) {
          const amt = parseFloat(item.cost) || 0;
          totalKrw += amt * safeRate; 
        }
      });
    });
    return Math.round(totalKrw);
  };

  const getCategoryColor = (category) => {
    const colors = { '체험': 'bg-orange-100 text-orange-700 border-orange-200', '식당': 'bg-red-100 text-red-700 border-red-200', '교통': 'bg-indigo-100 text-indigo-700 border-indigo-200', '관광': 'bg-emerald-100 text-emerald-700 border-emerald-200', '기타': 'bg-slate-100 text-slate-700 border-slate-200' };
    return colors[category] || colors['기타'];
  };

  if (availableDays.length === 0) {
    return (
      <div className="bg-white p-10 rounded-3xl shadow-sm border border-sky-100 min-h-[500px] flex flex-col items-center justify-center text-slate-400 italic space-y-4">
        <span className="text-6xl">💸</span>
        <p className="text-lg font-bold">비용을 계산할 일정이 없어요.</p>
        <p className="text-sm">[일정 정리] 탭에서 일정을 먼저 추가해주세요!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 relative pb-24">
      
      {/* 상단 고정: 총 예상 비용 바 및 환율 입력 */}
      <div className="sticky top-[136px] z-30 bg-[#fcfdff] pt-2 pb-4 -mx-2 px-2">
        <div className="max-w-4xl mx-auto w-full">
          <div className="bg-gradient-to-r from-sky-600 to-sky-500 p-6 rounded-3xl shadow-md flex items-center justify-between text-white border border-sky-400">
            <div>
              <h3 className="text-sky-100 font-bold text-sm mb-1">여행 총 예상 비용 <span className="text-yellow-300 font-black text-xs ml-2">(교통비 제외)</span></h3>
              <p className="text-xs text-sky-200">입력된 비용을 기준 환율로 계산한 총합입니다.</p>
            </div>
            
            <div className="flex flex-col items-end gap-2 text-right">
              <div className="flex items-center gap-2 bg-sky-800/40 px-3 py-1.5 rounded-xl border border-sky-400/50">
                <span className="text-sky-100 font-bold text-xs">환율 설정 (1$ =)</span>
                <input 
                  type="number" 
                  value={exchangeRate} 
                  onChange={(e) => setExchangeRate(Number(e.target.value))} 
                  className="w-16 bg-transparent border-b border-sky-300 text-white font-black outline-none text-right text-sm"
                />
                <span className="text-sky-100 font-bold text-xs">원</span>
              </div>
              
              <span className="text-4xl font-black tracking-tight">
                {calculateTotalCost().toLocaleString()} <span className="text-2xl font-bold opacity-80">원</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-10">
        {availableDays.map((dayStr, index) => {
          const items = timeline[dayStr];
          const formattedDate = new Date(dayStr).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' });
          
          const dayTotalCost = items.reduce((sum, item) => {
            if (item.category === '교통') return sum; 
            let itemTotal = 0;
            if (item.expenses && item.expenses.length > 0) {
              item.expenses.forEach(ex => { 
                const amt = parseFloat(ex.amount) || 0;
                itemTotal += (ex.currency || 'USD') === 'USD' ? amt * safeRate : amt; 
              });
            } else if (item.cost) {
              itemTotal += (parseFloat(item.cost) || 0) * safeRate;
            }
            return sum + itemTotal;
          }, 0);

          return (
            <div key={dayStr} className="bg-white rounded-3xl shadow-sm border border-sky-100 overflow-hidden">
              <div className="bg-sky-50 border-b border-sky-100 p-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <h4 className="text-xl font-black text-sky-800">Day {index + 1}</h4>
                  <span className="text-sm font-bold text-sky-600 bg-white px-2 py-1 rounded-md shadow-sm">{formattedDate}</span>
                </div>
                <div className="text-right font-bold text-slate-700">
                  <span className="text-xs text-slate-400 mr-2">일일 합계 (교통비 제외)</span>
                  <span className="text-lg text-sky-700">{Math.round(dayTotalCost).toLocaleString()} 원</span>
                </div>
              </div>

              <div className="p-3">
                {items.map((item, idx) => {
                  let expensesToRender = [];
                  if (item.expenses && item.expenses.length > 0) expensesToRender = item.expenses;
                  else expensesToRender = [{ id: `init_${item.id}`, desc: '', amount: item.cost || '', isConfirmed: false, currency: 'USD', isPlaceholder: true }];

                  const isTransport = item.category === '교통';

                  return (
                    <div key={item.id} className={`p-5 ${idx !== items.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50 transition-colors rounded-2xl ${isTransport ? 'bg-indigo-50/30' : ''}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 font-black flex items-center justify-center text-xs shrink-0">{idx + 1}</div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded border shrink-0 ${getCategoryColor(item.category)}`}>{item.category}</span>
                          <span className="font-bold text-slate-800 text-base truncate">{item.alias}</span>
                          {isTransport && <span className="text-[10px] font-bold text-indigo-400 border border-indigo-200 px-1.5 py-0.5 rounded bg-white">합계 제외됨</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleSyncExpenses(item.id, item.alias)} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-indigo-100 shadow-sm" title={`모든 '${item.alias}' 일정에 이 비용을 똑같이 적용합니다.`}><span>🔄</span> 일괄 적용</button>
                          <button onClick={() => handleAddExpense(dayStr, item.id)} className="text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors border border-sky-100 shadow-sm"><span>➕</span> 비용 추가</button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pl-12 pr-2">
                        {expensesToRender.map((exp) => {
                          // ⭐️ 공통 클래스 및 색상 지정 (기본값: 회색 / 변경값: 초록색)
                          const isConfirmed = exp.isConfirmed;
                          const isKrw = (exp.currency || 'USD') === 'KRW';
                          
                          const grayClass = 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200';
                          const greenClass = 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border border-emerald-200';

                          return (
                            <div key={exp.id} className="flex items-center gap-2">
                              {/* 1. 확정/예상 토큰 (기본 예상=회색, 확정=초록색) */}
                              <button 
                                onClick={() => handleUpdateExpense(dayStr, item.id, exp.id, 'isConfirmed', !isConfirmed, exp.isPlaceholder)} 
                                className={`shrink-0 text-[11px] font-black px-2 py-2.5 rounded-lg transition-colors w-14 text-center shadow-sm ${isConfirmed ? greenClass : grayClass}`}
                              >
                                {isConfirmed ? '확정' : '예상'}
                              </button>
                              
                              {/* 2. 원/달러 토글 (기본 달러=회색, 원화=초록색) */}
                              <button 
                                onClick={() => handleUpdateExpense(dayStr, item.id, exp.id, 'currency', isKrw ? 'USD' : 'KRW', exp.isPlaceholder)} 
                                className={`shrink-0 text-[11px] font-black px-2 py-2.5 rounded-lg transition-colors w-14 text-center shadow-sm ${isKrw ? greenClass : grayClass}`}
                              >
                                {isKrw ? '₩ 원화' : '$ 달러'}
                              </button>

                              {/* 3. 내용 입력 */}
                              <input 
                                type="text" 
                                value={exp.desc} 
                                onChange={(e) => handleUpdateExpense(dayStr, item.id, exp.id, 'desc', e.target.value, exp.isPlaceholder)} 
                                placeholder="내용 (ex. 입장료, 식비)" 
                                className={`flex-1 p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-sky-400 text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-normal shadow-sm ${isTransport ? 'text-indigo-700' : ''}`} 
                              />
                              
                              {/* 4. 금액 입력 */}
                              <div className="relative shrink-0 flex items-center gap-2">
                                <input 
                                  type="text" 
                                  value={exp.amount} 
                                  onChange={(e) => { 
                                    let val = e.target.value.replace(/[^0-9.]/g, ''); 
                                    const parts = val.split('.');
                                    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                                    handleUpdateExpense(dayStr, item.id, exp.id, 'amount', val, exp.isPlaceholder); 
                                  }} 
                                  placeholder="금액" 
                                  className={`w-28 text-right p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-sky-400 text-sm font-bold placeholder:text-slate-300 placeholder:font-normal shadow-sm ${isTransport ? 'text-indigo-400 line-through' : 'text-sky-700'}`} 
                                />
                                <span className="font-bold text-slate-400 text-sm w-6 text-center">
                                  {isKrw ? '원' : '$'}
                                </span>
                              </div>

                              {/* 5. 삭제 버튼 */}
                              {(!exp.isPlaceholder || expensesToRender.length > 1) && (
                                <button onClick={() => handleRemoveExpense(dayStr, item.id, exp.id)} className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 ml-1" title="비용 항목 삭제">✕</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}