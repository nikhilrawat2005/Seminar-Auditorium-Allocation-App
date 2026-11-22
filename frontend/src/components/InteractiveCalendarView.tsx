import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Tag,
  Building,
  Calendar as CalendarIcon,
  X,
  PlusCircle
} from 'lucide-react';

interface EventItem {
  id: string;
  event_name: string;
  organization_name: string;
  venue_id: string;
  venue_name: string;
  start: string;
  end: string;
  category: string;
}

interface VenueItem {
  id: string;
  name: string;
  block?: string;
  location: string;
  capacity: number;
}

interface Props {
  events: EventItem[];
  venues: VenueItem[];
}

export const InteractiveCalendarView: React.FC<Props> = ({ events, venues }) => {
  const navigate = useNavigate();
  const { user, profiles, switchToProfile } = useAuth();
  // Calendar month/year navigation state
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 10, 20)); // Nov 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-11-22');
  const [activeModalEvent, setActiveModalEvent] = useState<EventItem | null>(null);

  const handleBookOnDate = async (dateStr: string) => {
    // If not already in applicant role, switch seamlessly to applicant profile
    if (!user || user.role !== 'applicant') {
      const applicantProfile = profiles.find((p) => p.role === 'applicant');
      if (applicantProfile) {
        await switchToProfile(applicantProfile.id);
      }
    }
    navigate(`/applicant/dashboard?newBooking=true&date=${dateStr}`);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (10 = November)

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 10, 20));
    setSelectedDateStr('2026-11-20');
  };

  const formatYMD = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Group events by date string "YYYY-MM-DD"
  const eventsByDate = events.reduce<Record<string, EventItem[]>>((acc, ev) => {
    const datePart = ev.start.split('T')[0];
    if (!acc[datePart]) acc[datePart] = [];
    acc[datePart].push(ev);
    return acc;
  }, {});

  const selectedDateEvents = [...(eventsByDate[selectedDateStr] || [])].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  const getCategoryTheme = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'technical':
        return {
          pill: 'bg-blue-100 text-blue-800 border-blue-200',
          dot: 'bg-blue-600',
          badge: 'bg-blue-500 text-white',
        };
      case 'cultural':
        return {
          pill: 'bg-purple-100 text-purple-800 border-purple-200',
          dot: 'bg-purple-600',
          badge: 'bg-purple-500 text-white',
        };
      case 'sports':
        return {
          pill: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-600',
          badge: 'bg-emerald-500 text-white',
        };
      case 'seminar':
      case 'workshop':
        return {
          pill: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-600',
          badge: 'bg-amber-500 text-white',
        };
      default:
        return {
          pill: 'bg-slate-100 text-slate-800 border-slate-200',
          dot: 'bg-slate-600',
          badge: 'bg-slate-500 text-white',
        };
    }
  };

  // Build grid calendar cells
  const calendarCells = [];

  // 1. Prev month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    calendarCells.push({
      day: d,
      currentMonth: false,
      dateStr: formatYMD(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, d),
    });
  }

  // 2. Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      day: d,
      currentMonth: true,
      dateStr: formatYMD(year, month, d),
    });
  }

  // 3. Next month leading days (to complete rows of 7)
  const remainingCells = 35 - calendarCells.length;
  const trailingCount = remainingCells >= 0 ? remainingCells : 42 - calendarCells.length;
  for (let d = 1; d <= trailingCount; d++) {
    calendarCells.push({
      day: d,
      currentMonth: false,
      dateStr: formatYMD(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1, d),
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Calendar Header with Navigation Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-900 text-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
              <span>{monthNames[month]} {year}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Operating Window: 07:00 AM – 06:30 PM
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Multiple custom slots per day supported — check confirmed event timings on any date
            </p>
          </div>
        </div>

        {/* Month Switching Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer"
          >
            Today (Nov 20)
          </button>
          <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 p-0.5">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-md transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar View: Grid & Side Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        {/* Left 8 Cols: Month Calendar Grid */}
        <div className="lg:col-span-8 p-4 sm:p-6">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            {daysOfWeek.map((day, idx) => (
              <div
                key={day}
                className={`py-1.5 ${idx === 0 || idx === 6 ? 'text-blue-600' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Matrix Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarCells.map((cell, index) => {
              const dayEvents = eventsByDate[cell.dateStr] || [];
              const isSelected = selectedDateStr === cell.dateStr;
              const isToday = cell.dateStr === '2026-11-20';

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                  className={`min-h-[82px] sm:min-h-[96px] p-1.5 sm:p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 shadow-sm ring-2 ring-blue-500/20'
                      : isToday
                      ? 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
                      : cell.currentMonth
                      ? 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
                      : 'border-slate-100 bg-slate-50/40 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-amber-600 text-white font-extrabold shadow-sm'
                          : isSelected
                          ? 'bg-blue-600 text-white'
                          : cell.currentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700">
                        {dayEvents.length} {dayEvents.length === 1 ? 'Booking' : 'Bookings'}
                      </span>
                    )}
                  </div>

                  {/* Tiny Event Badges in Cell */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const theme = getCategoryTheme(ev.category);
                      const startTime = ev.start.split('T')[1]?.slice(0, 5);

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDateStr(cell.dateStr);
                            setActiveModalEvent(ev);
                          }}
                          className={`text-[9px] sm:text-[10px] truncate px-1.5 py-0.5 rounded font-medium ${theme.pill} hover:opacity-85 transition`}
                          title={`${ev.event_name} (${startTime} - ${ev.end.split('T')[1]?.slice(0, 5)})`}
                        >
                          <span className="font-semibold">{startTime}</span> {ev.event_name}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-slate-500 font-semibold px-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Legend */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-700">Categories:</span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-1.5"></span> Technical
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 mr-1.5"></span> Cultural
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 mr-1.5"></span> Sports
              </span>
              <span className="flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 mr-1.5"></span> Seminar
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              *Verified institutional records
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Selected Date Clean Normal Schedule List */}
        <div className="lg:col-span-4 p-4 sm:p-6 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Bookings on this Date
                </p>
                <h4 className="font-extrabold text-slate-900 text-base">
                  {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h4>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-800">
                {selectedDateEvents.length} {selectedDateEvents.length === 1 ? 'Event' : 'Events'}
              </span>
            </div>

            {/* List of events on this day */}
            <div className="mt-4 space-y-3">
              {selectedDateEvents.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <CalendarIcon className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No Bookings on this date</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Venues are open for reservation between 07:00 AM – 06:30 PM.
                  </p>
                </div>
              ) : (
                selectedDateEvents.map((ev) => {
                  const theme = getCategoryTheme(ev.category);
                  const matchingVenue = venues.find((v) => v.id === ev.venue_id);
                  const startTime = ev.start.split('T')[1]?.slice(0, 5);
                  const endTime = ev.end.split('T')[1]?.slice(0, 5);

                  return (
                    <div
                      key={ev.id}
                      onClick={() => setActiveModalEvent(ev)}
                      className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.pill}`}>
                          {ev.category}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Confirmed
                        </span>
                      </div>

                      <h5 className="font-bold text-slate-900 text-sm leading-snug">{ev.event_name}</h5>
                      <p className="text-xs font-medium text-blue-600 mt-0.5 flex items-center">
                        <Tag className="w-3 h-3 mr-1" />
                        {ev.organization_name}
                      </p>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                        <div className="flex items-center font-medium text-slate-800">
                          <Building className="w-3.5 h-3.5 text-slate-400 mr-1.5 shrink-0" />
                          <span>{ev.venue_name}</span>
                          {matchingVenue?.block && (
                            <span className="text-[10px] text-slate-500 ml-1 font-normal">
                              ({matchingVenue.block})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-slate-800 font-semibold bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                          <Clock className="w-3.5 h-3.5 text-blue-600 mr-1.5 shrink-0" />
                          <span>
                            {startTime} to {endTime} ({ev.start.split('T')[0]})
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Book on This Date Action Button */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => handleBookOnDate(selectedDateStr)}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/25 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Book a Venue on this Date ({selectedDateStr})</span>
              </button>
            </div>
          </div>

          {/* Clean footer info */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-[11px] text-slate-500">
            ℹ️ Operating hours: 07:00 AM – 06:30 PM. Any available non-overlapping time slot can be reserved.
          </div>
        </div>
      </div>

      {/* Event Details Modal Popup */}
      {activeModalEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setActiveModalEvent(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-3">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getCategoryTheme(activeModalEvent.category).pill}`}>
                {activeModalEvent.category}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Verified Allocation
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900">{activeModalEvent.event_name}</h3>
            <p className="text-xs font-semibold text-blue-600 mt-1 flex items-center">
              <Tag className="w-3.5 h-3.5 mr-1" />
              Organized by: {activeModalEvent.organization_name}
            </p>

            <div className="mt-5 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
              <div className="flex items-start">
                <MapPin className="w-4 h-4 text-blue-600 mr-2 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 block">{activeModalEvent.venue_name}</span>
                  <span className="text-slate-500">
                    {venues.find((v) => v.id === activeModalEvent.venue_id)?.location || 'ABES Campus'}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <Clock className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800">
                    Timing: {activeModalEvent.start.split('T')[1]?.slice(0, 5)} to {activeModalEvent.end.split('T')[1]?.slice(0, 5)}
                  </span>
                  <span className="text-slate-500 block text-[11px]">
                    Date: {activeModalEvent.start.split('T')[0]} (Operating Hours: 07:00 – 18:30)
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <Building className="w-4 h-4 text-blue-600 mr-2 shrink-0" />
                <div>
                  <span className="text-slate-600">
                    Facility Capacity: {venues.find((v) => v.id === activeModalEvent.venue_id)?.capacity || 500} seats
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setActiveModalEvent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
