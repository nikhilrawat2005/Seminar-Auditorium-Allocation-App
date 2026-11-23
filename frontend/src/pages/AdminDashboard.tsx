import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  ShieldCheck,
  Clock,
  Building,
  Check,
  X,
  FileCheck2,
  Calendar,
  Users,
  UserPlus,
  Trash2,
  Edit,
  KeyRound,
  Mail,
  AlertCircle,
  Search,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileSwitcher } from '../components/ProfileSwitcher';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'applicants'>('approvals');
  const [applications, setApplications] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Decision Modal State
  const [activeApp, setActiveApp] = useState<any | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected'>('approved');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Applicant Account Management Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    organization_name: '',
    password: '',
    status: 'active',
    role: 'applicant',
  });
  const [userFormError, setUserFormError] = useState('');
  const [userFormSubmitting, setUserFormSubmitting] = useState(false);
  const [applicantSearch, setApplicantSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    try {
      const [appRes, venRes, bookRes, userRes] = await Promise.all([
        api.get('/applications'),
        api.get('/venues'),
        api.get('/bookings'),
        api.get('/users'),
      ]);
      setApplications(appRes.data);
      setVenues(venRes.data);
      setBookings(bookRes.data);
      setUsersList(userRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeApp) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      await api.post(`/approvals/${activeApp.id}`, {
        decision,
        remarks,
      });
      setActiveApp(null);
      setRemarks('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit decision.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open User Create/Edit Modal
  const openCreateUserModal = () => {
    setEditingUserId(null);
    setUserFormData({
      name: '',
      email: '',
      organization_name: '',
      password: '',
      status: 'active',
      role: 'applicant',
    });
    setUserFormError('');
    setShowUserModal(true);
  };

  const openEditUserModal = (targetUser: any) => {
    setEditingUserId(targetUser.id);
    setUserFormData({
      name: targetUser.name,
      email: targetUser.email,
      organization_name: targetUser.organization_name || '',
      password: '', // Blank unless admin wants to reset password
      status: targetUser.status || 'active',
      role: targetUser.role || 'applicant',
    });
    setUserFormError('');
    setShowUserModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    setUserFormSubmitting(true);

    try {
      if (editingUserId) {
        // Update user
        const payload: any = {
          name: userFormData.name,
          organization_name: userFormData.organization_name,
          status: userFormData.status,
        };
        if (userFormData.password.trim()) {
          payload.password = userFormData.password;
        }
        await api.put(`/users/${editingUserId}`, payload);
      } else {
        // Create new applicant account
        if (!userFormData.password.trim()) {
          setUserFormError('Password is required for a new applicant account');
          setUserFormSubmitting(false);
          return;
        }
        await api.post('/users', userFormData);
      }
      setShowUserModal(false);
      fetchData();
    } catch (err: any) {
      setUserFormError(err.response?.data?.detail || 'Failed to save applicant user account.');
    } finally {
      setUserFormSubmitting(false);
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    if (targetUser.role === 'admin') {
      alert('Administrator accounts cannot be deleted.');
      return;
    }
    const confirmDelete = window.confirm(
      `Are you sure you want to remove applicant account '${targetUser.name}' (${targetUser.email})?`
    );
    if (!confirmDelete) return;

    try {
      await api.delete(`/users/${targetUser.id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete applicant user.');
    }
  };

  const pendingApps = applications.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'PARTIALLY_APPROVED'
  );
  const applicantUsers = usersList.filter((u) => u.role === 'applicant');
  const filteredApplicants = applicantUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(applicantSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(applicantSearch.toLowerCase()) ||
      (u.organization_name && u.organization_name.toLowerCase().includes(applicantSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Admin Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-white text-base leading-tight">Admin Control Center</h1>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Admin: {user?.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {user?.organization_name || 'ABES Central Administration Board'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className="hidden sm:flex items-center text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
            >
              <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Calendar
            </Link>
            <ProfileSwitcher />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Pending Approvals
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-amber-600">{pendingApps.length}</span>
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Active Applicants
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-blue-600">{applicantUsers.length}</span>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Confirmed Bookings
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-emerald-600">{bookings.length}</span>
              <FileCheck2 className="w-5 h-5 text-emerald-500" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Managed Venues
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-black text-slate-800">{venues.length}</span>
              <Building className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Tab Navigation: Approvals Queue vs Applicant Account Management */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'approvals'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileCheck2 className="w-4 h-4 mr-1.5" />
              Venue Approvals Queue ({pendingApps.length})
            </button>
            <button
              onClick={() => setActiveTab('applicants')}
              className={`flex items-center px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTab === 'applicants'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4 mr-1.5" />
              Applicant Account Management ({applicantUsers.length})
            </button>
          </div>

          {activeTab === 'applicants' && (
            <button
              onClick={openCreateUserModal}
              className="flex items-center px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Create New Applicant Account
            </button>
          )}
        </div>

        {/* TAB 1: APPROVALS QUEUE */}
        {activeTab === 'approvals' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Applications Requiring Verification</h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                Dual Sign-Off Mode
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Ref ID</th>
                    <th className="px-5 py-3">Event Details</th>
                    <th className="px-5 py-3">Applicant / Club</th>
                    <th className="px-5 py-3">Date & Slot</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        No venue booking applications on record.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => {
                      const alreadyDecided = app.approvals?.some((a: any) => a.admin_id === user?.id);
                      const isPending = app.status === 'SUBMITTED' || app.status === 'PARTIALLY_APPROVED';

                      return (
                        <tr key={app.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-5 py-4 font-mono font-bold text-slate-800">
                            {app.public_ref}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-bold text-slate-900 block">{app.event_name}</span>
                            <span className="text-slate-500 text-[11px] block">{app.venue_name}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-slate-800 block">{app.applicant_name}</span>
                            <span className="text-slate-500 text-[11px] block">{app.organization_name}</span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-medium text-slate-800 block">{app.event_date}</span>
                            <span className="text-blue-600 text-[11px] block font-semibold">
                              {app.start_time} - {app.end_time}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                app.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : app.status === 'PARTIALLY_APPROVED'
                                  ? 'bg-blue-100 text-blue-800'
                                  : app.status === 'REJECTED'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {isPending ? (
                              alreadyDecided ? (
                                <span className="text-slate-400 text-xs italic">Signed by you</span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setActiveApp(app);
                                    setDecision('approved');
                                    setRemarks('');
                                  }}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
                                >
                                  Review & Sign
                                </button>
                              )
                            ) : (
                              <span className="text-slate-400 text-xs">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: APPLICANT ACCOUNT MANAGEMENT */}
        {activeTab === 'applicants' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 bg-slate-50/70">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Authorized Applicant Accounts ({applicantUsers.length})
                </h3>
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search applicant or club..."
                    value={applicantSearch}
                    onChange={(e) => setApplicantSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Applicant Name</th>
                    <th className="px-5 py-3">Login Username / Email</th>
                    <th className="px-5 py-3">Affiliated Club / Organization</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal">
                  {filteredApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-400">
                        No applicant accounts found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredApplicants.map((appl) => (
                      <tr key={appl.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-4 font-bold text-slate-900 flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {appl.name[0]?.toUpperCase() || 'A'}
                          </div>
                          <span>{appl.name}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] block w-fit">
                            {appl.email}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 font-medium">
                          {appl.organization_name || 'General Student Body'}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              appl.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {appl.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => openEditUserModal(appl)}
                              title="Edit applicant account or reset password"
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(appl)}
                              title="Delete applicant account"
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* CREATE / EDIT APPLICANT ACCOUNT MODAL */}
      {showUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setShowUserModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingUserId ? 'Edit Applicant Account' : 'Create New Applicant Account'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {editingUserId
                    ? 'Update profile details or assign a new password'
                    : 'Admin creates username & password for the club/applicant'}
                </p>
              </div>
            </div>

            {userFormError && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r flex items-center">
                <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
                <span>{userFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applicant Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sahil Gupta (President)"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username / Login Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingUserId)} // Email immutable once created
                    placeholder="e.g. robotics.club@abes.ac.in"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className={`w-full text-xs border border-slate-300 rounded-lg p-2.5 pl-8 focus:ring-2 focus:ring-blue-500 ${
                      editingUserId ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Affiliated Club / Organization
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robotics & Automation Club"
                    value={userFormData.organization_name}
                    onChange={(e) =>
                      setUserFormData({ ...userFormData, organization_name: e.target.value })
                    }
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 pl-8 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {editingUserId ? 'Reset Password (Leave blank to keep existing)' : 'Set Login Password'}
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required={!editingUserId}
                    placeholder={editingUserId ? '•••••••• (Enter new password to change)' : 'Create account password'}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 pl-8 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
                <select
                  value={userFormData.status}
                  onChange={(e) => setUserFormData({ ...userFormData, status: e.target.value })}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="active">Active (Can log in & book)</option>
                  <option value="suspended">Suspended (Access blocked)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={userFormSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition cursor-pointer"
                >
                  {userFormSubmitting
                    ? 'Saving...'
                    : editingUserId
                    ? 'Save Changes'
                    : 'Create Applicant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPROVAL DECISION MODAL */}
      {activeApp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setActiveApp(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg font-bold"
            >
              &times;
            </button>

            <h3 className="font-bold text-slate-900 text-base mb-1">Application Dual Sign-Off</h3>
            <p className="text-xs text-slate-500 mb-4 font-mono">{activeApp.public_ref}</p>

            {errorMsg && (
              <div className="mb-3 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-r">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Authority Decision</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDecision('approved')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center transition cursor-pointer ${
                      decision === 'approved'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('rejected')}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border flex items-center justify-center transition cursor-pointer ${
                      decision === 'rejected'
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <X className="w-4 h-4 mr-1" /> Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks {decision === 'rejected' && <span className="text-red-500">* (Mandatory)</span>}
                </label>
                <textarea
                  required={decision === 'rejected'}
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    decision === 'rejected'
                      ? 'Specify exact reason for rejection (e.g. Schedule clash, security concerns)'
                      : 'Optional remarks or instructions for the applicant'
                  }
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setActiveApp(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-1.5 text-xs font-bold text-white rounded-lg transition cursor-pointer ${
                    decision === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Submitting...' : `Submit ${decision.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
