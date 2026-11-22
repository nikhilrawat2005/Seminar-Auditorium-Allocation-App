import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, ChevronDown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfileSwitcher: React.FC = () => {
  const { user, profiles, switchToProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (profileId: string) => {
    if (user?.id === profileId) {
      setIsOpen(false);
      return;
    }
    setSwitching(true);
    const updatedUser = await switchToProfile(profileId);
    setSwitching(false);
    setIsOpen(false);

    if (updatedUser) {
      if (updatedUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/applicant/dashboard');
      }
    }
  };

  const currentRoleBadge = user?.role === 'admin' ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
      <Shield className="w-3 h-3 mr-1" /> Admin
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
      <Users className="w-3 h-3 mr-1" /> Applicant
    </span>
  );

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={switching}
        className="flex items-center space-x-2.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg text-sm font-medium border border-slate-700 transition shadow-sm cursor-pointer"
        title="Switch active profile role instantly"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
          {user?.name ? user.name[0].toUpperCase() : 'P'}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-xs font-semibold leading-tight truncate max-w-[140px] text-white">
            {user?.name || 'Select Profile'}
          </p>
          <p className="text-[10px] text-slate-400 capitalize">
            {user?.role ? `${user.role} mode` : 'No profile'}
          </p>
        </div>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 divide-y divide-slate-100 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 bg-slate-50/80 rounded-t-xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Profile Switcher
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              Switch role instantly without entering passwords
            </p>
          </div>

          <div className="py-1 max-h-72 overflow-y-auto">
            {profiles.map((p) => {
              const isCurrent = user?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${
                    isCurrent ? 'bg-blue-50/70 font-semibold' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        p.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {p.name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-900 leading-snug">
                        {p.name}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-none mt-0.5">
                        {p.organization_name || p.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        p.role === 'admin'
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}
                    >
                      {p.role}
                    </span>
                    {isCurrent && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2 bg-slate-50 rounded-b-xl flex justify-between items-center text-[11px] text-slate-500">
            <span>Current: {currentRoleBadge}</span>
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/');
              }}
              className="text-blue-600 hover:underline cursor-pointer"
            >
              Public Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
