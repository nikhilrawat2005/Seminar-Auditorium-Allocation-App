import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  Building,
  Send,
  RotateCcw,
  Calendar
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { ProfileSwitcher } from '../components/ProfileSwitcher';
import { MiniCalendarPicker } from '../components/MiniCalendarPicker';

export const ApplicantDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [applications, setApplications] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    venue_id: '',
    event_name: '',
    event_description: '',
    event_category: 'Technical',
    event_date: '2026-11-23',
    start_time: '10:00',
    end_time: '14:00',
    expected_participants: 50,
    additional_requirements: '',
  });

  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();

    // Auto-open modal if URL has ?newBooking=true or ?date=...
    const shouldOpenNew = searchParams.get('newBooking') === 'true';
    const paramDate = searchParams.get('date');
    const paramVenue = searchParams.get('venue_id');
    const paramStartTime = searchParams.get('start_time');
    const paramEndTime = searchParams.get('end_time');

    if (shouldOpenNew || paramDate) {
      setShowModal(true);
      setFormData((prev) => ({
        ...prev,
        event_date: paramDate || prev.event_date || '2026-11-23',
        venue_id: paramVenue || prev.venue_id,
        start_time: paramStartTime || prev.start_time,
        end_time: paramEndTime || prev.end_time,
      }));
    }
  }, [user?.id, searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, venRes] = await Promise.all([
        api.get('/applications'),
        api.get('/venues', { params: { status: 'active' } }),
      ]);
      setApplications(appRes.data);
      setVenues(venRes.data);
      if (venRes.data.length > 0 && !formData.venue_id) {
        setFormData((prev) => ({ ...prev, venue_id: venRes.data[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      await api.post('/applications', formData);
      setShowModal(false);
      // Reset form
      setFormData({
        venue_id: venues[0]?.id || '',
        event_name: '',
        event_description: '',
        event_category: 'Technical',
        event_date: '',
        start_time: '10:00',
        end_time: '14:00',
        expected_participants: 50,
        additional_requirements: '',
      });
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to submit request.');
    }
  };

  const handleWithdraw = async (appId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await api.post(`/applications/${appId}/withdraw`);
      fetchData();
      if (selectedApp?.id === appId) {
        setSelectedApp(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to withdraw.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved
          </span>
        );
      case 'PARTIALLY_APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3.5 h-3.5 mr-1" /> Partially Approved (1/2)
          </span>
        );
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 mr-1" /> Pending Admin Review
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
          </span>
        );
      case 'WITHDRAWN':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            Withdrawn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-slate-900 leading-tight">ABES EC Applicant Portal</h1>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Campus Facilities
                </span>
              </div>
              <p className="text-xs text-slate-500">{user?.organization_name || user?.name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="hidden sm:flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
            >
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Calendar
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Venue Request
            </button>
            <ProfileSwitcher />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Applications List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">My Venue Requests</h2>
            <span className="text-xs font-semibold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              {applications.length} requests
            </span>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading requests...</div>
          ) : applications.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">You have not submitted any venue requests yet.</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-xs font-semibold text-blue-600 hover:underline"
              >
                Submit your first application →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`bg-white p-5 rounded-xl border transition-all cursor-pointer ${
                    selectedApp?.id === app.id
                      ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-slate-500">{app.public_ref}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-medium text-blue-600">{app.event_category}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base mt-1">{app.event_name}</h3>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div>
                      <span className="text-slate-400 block">Venue</span>
                      <span className="font-medium text-slate-800">{app.venue_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Event Date</span>
                      <span className="font-medium text-slate-800">{app.event_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Time Slot</span>
                      <span className="font-medium text-slate-800">
                        {app.start_time} - {app.end_time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Detailed View & Timeline */}
        <div className="lg:col-span-1">
          {selectedApp ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="font-mono text-xs text-slate-400">{selectedApp.public_ref}</span>
                  <h3 className="text-base font-bold text-slate-900">{selectedApp.event_name}</h3>
                </div>
                {getStatusBadge(selectedApp.status)}
              </div>

              <div className="py-4 space-y-3 text-xs text-slate-600 border-b border-slate-100">
                <div>
                  <span className="font-semibold text-slate-700 block">Description</span>
                  <p className="mt-1 text-slate-600">{selectedApp.event_description}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-700 block">Expected Attendance</span>
                  <p className="text-slate-600">{selectedApp.expected_participants} attendees</p>
                </div>
                {selectedApp.additional_requirements && (
                  <div>
                    <span className="font-semibold text-slate-700 block">Equipment & Requirements</span>
                    <p className="text-slate-600">{selectedApp.additional_requirements}</p>
                  </div>
                )}
              </div>

              {/* Dual Admin Approval Progress */}
              <div className="py-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Dual Admin Review Status
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 text-xs">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        selectedApp.approvals?.length > 0
                          ? selectedApp.approvals[0].decision === 'approved'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-red-100 text-red-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {selectedApp.approvals?.length > 0 ? (
                        selectedApp.approvals[0].decision === 'approved' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )
                      ) : (
                        '1'
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">First Admin Review</p>
                      <p className="text-slate-500">
                        {selectedApp.approvals?.[0]
                          ? `${selectedApp.approvals[0].decision.toUpperCase()} - ${selectedApp.approvals[0].remarks || 'No remarks'}`
                          : 'Pending review'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-xs">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        selectedApp.approvals?.length > 1
                          ? selectedApp.approvals[1].decision === 'approved'
                            ? 'bg-emerald-100 text-emerald-600'
                            : 'bg-red-100 text-red-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {selectedApp.approvals?.length > 1 ? (
                        selectedApp.approvals[1].decision === 'approved' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )
                      ) : (
                        '2'
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Second Admin Review</p>
                      <p className="text-slate-500">
                        {selectedApp.approvals?.[1]
                          ? `${selectedApp.approvals[1].decision.toUpperCase()} - ${selectedApp.approvals[1].remarks || 'No remarks'}`
                          : selectedApp.status === 'REJECTED'
                          ? 'Process halted due to rejection'
                          : 'Awaiting independent decision'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center space-x-2">
                {['SUBMITTED', 'UNDER_REVIEW', 'PARTIALLY_APPROVED'].includes(selectedApp.status) && (
                  <button
                    onClick={() => handleWithdraw(selectedApp.id)}
                    className="w-full py-2 px-3 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition cursor-pointer"
                  >
                    Withdraw Request
                  </button>
                )}
                {selectedApp.status === 'REJECTED' && (
                  <button
                    onClick={() => {
                      setFormData({
                        venue_id: selectedApp.venue_id,
                        event_name: selectedApp.event_name,
                        event_description: selectedApp.event_description,
                        event_category: selectedApp.event_category,
                        event_date: selectedApp.event_date,
                        start_time: selectedApp.start_time,
                        end_time: selectedApp.end_time,
                        expected_participants: selectedApp.expected_participants,
                        additional_requirements: selectedApp.additional_requirements || '',
                      });
                      setShowModal(true);
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition flex items-center justify-center cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1" />
                    Resubmit Revised Version
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-100/70 border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500 text-xs">
              Select an application on the left to inspect its real-time approval timeline and admin remarks.
            </div>
          )}
        </div>
      </main>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg">New Venue Booking Request</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="my-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Campus Venue</label>
                <select
                  required
                  value={formData.venue_id}
                  onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.block ? `[${v.block}] ` : ''}{v.name} (Capacity: {v.capacity}) - {v.location}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Tech Symposium"
                  value={formData.event_name}
                  onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.event_category}
                    onChange={(e) => setFormData({ ...formData, event_category: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Seminar">Seminar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expected Attendees</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.expected_participants}
                    onChange={(e) => setFormData({ ...formData, expected_participants: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Mini Calendar Picker embedded right inside the Booking Modal */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>📅 Select Event Booking Date</span>
                  <span className="text-[11px] text-blue-600 font-normal">Click a date on the calendar</span>
                </label>
                <MiniCalendarPicker
                  selectedDate={formData.event_date}
                  onSelectDate={(newDate) => setFormData({ ...formData, event_date: newDate })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 font-semibold text-blue-900 bg-blue-50/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time (Min 07:00)</label>
                  <input
                    type="time"
                    min="07:00"
                    max="18:30"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time (Max 18:30)</label>
                  <input
                    type="time"
                    min="07:00"
                    max="18:30"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Provide context on event purpose and agenda"
                  value={formData.event_description}
                  onChange={(e) => setFormData({ ...formData, event_description: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Equipment & Special Requirements
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Mics, sound console, power strips, seating layout"
                  value={formData.additional_requirements}
                  onChange={(e) => setFormData({ ...formData, additional_requirements: e.target.value })}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
