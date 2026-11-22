import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  Calendar,
  MapPin,
  Clock,
  Tag,
  ArrowRight,
  Building2,
  Layers,
  Sparkles,
  CalendarDays,
  ListFilter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileSwitcher } from '../components/ProfileSwitcher';
import { InteractiveCalendarView } from '../components/InteractiveCalendarView';
import { useAuth } from '../context/AuthContext';

export const PublicCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [selectedBlock, setSelectedBlock] = useState('All');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const blocks = ['All', 'Aryabhatta Block', 'Bhabha Block', 'Raman Block', 'Kalpana Chawla Block'];

  useEffect(() => {
    fetchData();
  }, [selectedVenue, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [calRes, venRes] = await Promise.all([
        api.get('/calendar', {
          params: {
            venue_id: selectedVenue || undefined,
            category: selectedCategory || undefined,
          },
        }),
        api.get('/venues'),
      ]);
      setEvents(calRes.data);
      setVenues(venRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = selectedBlock === 'All' 
    ? venues 
    : venues.filter((v) => v.block === selectedBlock);

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'technical':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cultural':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sports':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'workshop':
      case 'seminar':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  ABES Engineering College
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  Campus Facilities
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Centralized Venue Booking & Multi-Authority Permission System
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {user && (
              <Link
                to={user.role === 'admin' ? '/admin/dashboard' : '/applicant/dashboard'}
                className="flex items-center px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            )}
            <ProfileSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Banner with ABES Context */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="max-w-3xl relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 text-xs font-semibold bg-white/10 rounded-full tracking-wide uppercase backdrop-blur-sm border border-white/10 text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official ABES Campus Facility Booking</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-3 tracking-tight">
              Aryabhatta, Bhabha, Raman & Kalpana Chawla Blocks
            </h2>
            <p className="text-slate-300 mt-2 text-sm sm:text-base leading-relaxed">
              Real-time allocation grid across ABES EC venues—including Raman Auditorium, Temple Lawn Amphitheatre, Black Stone, and Seminar Halls.
            </p>
          </div>
        </div>

        {/* 1. ABES Academic Blocks Explorer Tabs */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-blue-600" />
              Campus Academic Blocks & Venues
            </h3>
            <span className="text-xs text-slate-500 font-medium">{filteredVenues.length} Venues Active</span>
          </div>

          <div className="flex flex-wrap gap-2 pb-2">
            {blocks.map((block) => (
              <button
                key={block}
                onClick={() => {
                  setSelectedBlock(block);
                  setSelectedVenue('');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedBlock === block
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {block}
              </button>
            ))}
          </div>

          {/* Venues Pill Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3">
            {filteredVenues.map((v) => (
              <div
                key={v.id}
                className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow transition"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-800 text-sm">{v.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Cap: {v.capacity}
                  </span>
                </div>
                <p className="text-xs text-blue-600 font-medium mt-1">{v.block}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{v.location}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. PROPER INTERACTIVE MONTHLY CALENDAR WITH FULL BOOKING DETAILS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <CalendarDays className="w-4 h-4 mr-1.5 text-blue-600" />
              Interactive Venue Booking Calendar
            </h3>
            <span className="text-xs text-blue-600 font-semibold">Click any date to see slot allocations</span>
          </div>

          <InteractiveCalendarView events={events} venues={venues} />
        </div>

        {/* 3. ALL CONFIRMED BOOKING CARDS (UNDERNEATH CALENDAR) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between bg-slate-50/70">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
              <ListFilter className="w-4 h-4 text-blue-600" />
              <span>All Confirmed Booking Records ({events.length})</span>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Filtered Venues</option>
                {filteredVenues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.block})
                  </option>
                ))}
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Event Categories</option>
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>
          </div>

          <div className="p-5">
            {loading ? (
              <div className="flex justify-center items-center py-16 text-slate-400">
                <Clock className="w-8 h-8 animate-spin mr-2 text-blue-600" />
                <span className="text-sm">Loading verified venue schedule...</span>
              </div>
            ) : events.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-base font-semibold text-slate-700">No Confirmed Events</h4>
                <p className="text-slate-500 text-xs mt-1">
                  There are no verified bookings matching your filter selection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryColor(
                            ev.category
                          )}`}
                        >
                          {ev.category}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Dual Approved
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-base line-clamp-1">{ev.event_name}</h4>
                      <p className="text-xs font-semibold text-blue-600 mt-1 flex items-center">
                        <Tag className="w-3.5 h-3.5 mr-1 text-blue-500" />
                        {ev.organization_name}
                      </p>

                      <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-200/60 pt-3">
                        <div className="flex items-center">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                          <span className="font-semibold text-slate-800">{ev.venue_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                          <span>
                            {ev.start.replace('T', ' ')} – {ev.end.split('T')[1] || ev.end}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>ABES Institutional Booking</span>
                      <span className="text-emerald-600 font-semibold">Confirmed Slot</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        ABES Engineering College • Campus Venue Booking & Centralized Permission System
      </footer>
    </div>
  );
};
