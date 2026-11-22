import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check } from 'lucide-react';

interface MiniCalendarPickerProps {
  selectedDate: string; // 'YYYY-MM-DD'
  onSelectDate: (dateStr: string) => void;
  minDate?: string;
}

export const MiniCalendarPicker: React.FC<MiniCalendarPickerProps> = ({
  selectedDate,
  onSelectDate,
  minDate = '2026-11-20',
}) => {
  const initialDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date(2026, 10, 20);
  const [viewDate, setViewDate] = useState<Date>(initialDate);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const formatYMD = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const cells = [];

  // Trailing prev month
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    cells.push({
      day: d,
      currentMonth: false,
      dateStr: formatYMD(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d),
    });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      currentMonth: true,
      dateStr: formatYMD(year, month, d),
    });
  }

  // Trailing next month
  const remaining = 35 - cells.length;
  const trailingCount = remaining >= 0 ? remaining : 42 - cells.length;
  for (let d = 1; d <= trailingCount; d++) {
    cells.push({
      day: d,
      currentMonth: false,
      dateStr: formatYMD(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d),
    });
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 select-none">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/80">
        <div className="flex items-center space-x-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-xs font-bold text-slate-800">
            {monthNames[month]} {year}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date(2026, 10, 20))}
            className="px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 hover:bg-blue-100 rounded transition cursor-pointer"
          >
            Nov '26
          </button>
          <button
            type="button"
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded transition cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1">
        {daysOfWeek.map((d, i) => (
          <div key={d} className={i === 0 || i === 6 ? 'text-blue-500' : ''}>
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, idx) => {
          const isSelected = selectedDate === c.dateStr;
          const isPast = Boolean(minDate && c.dateStr < minDate);

          return (
            <button
              key={idx}
              type="button"
              disabled={isPast}
              onClick={() => onSelectDate(c.dateStr)}
              className={`h-7 w-full rounded-lg text-xs font-semibold flex items-center justify-center transition cursor-pointer relative ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : isPast
                  ? 'text-slate-300 cursor-not-allowed opacity-40'
                  : c.currentMonth
                  ? 'text-slate-800 hover:bg-blue-100/70 hover:text-blue-700 bg-white border border-slate-200/60'
                  : 'text-slate-400 bg-slate-100/50 hover:bg-slate-200/60'
              }`}
            >
              <span>{c.day}</span>
              {isSelected && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
          <span className="flex items-center text-emerald-700 font-semibold">
            <Check className="w-3 h-3 mr-1" /> Selected: {selectedDate}
          </span>
          <span className="text-slate-400 text-[10px]">Click any date to pick</span>
        </div>
      )}
    </div>
  );
};
