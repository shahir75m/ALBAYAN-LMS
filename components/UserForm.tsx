
import React, { useState, useEffect, useRef } from 'react';
import { User, Role } from '../types';

interface UserFormProps {
  onClose: () => void;
  onSubmit: (user: User) => void;
  initialData?: User | null;
}

const UserForm: React.FC<UserFormProps> = ({ onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<User>({
    id: '', name: '', role: 'STUDENT', class: '', avatarUrl: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storedAdminPass = typeof window !== 'undefined' ? localStorage.getItem('adminPassword') || 'admin@484' : 'admin@484';

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData(prev => ({ ...prev, id: `U${Math.floor(Math.random() * 9000) + 1000}` }));
  }, [initialData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-[#f0f2f5]/40 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
      <div className="neo-card w-full max-w-md rounded-[2.5rem] overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-white/40 bg-white/10 flex justify-between items-center">
          <h3 className="font-black text-[10px] text-gray-500 uppercase tracking-[0.2em]">{initialData ? 'Patch Profile Nodes' : 'Register System User'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl neo-button flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="flex justify-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 rounded-[2.5rem] neo-inset flex items-center justify-center cursor-pointer overflow-hidden group transition-all relative"
            >
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="text-center">
                  <svg className="w-10 h-10 text-gray-300 mx-auto group-hover:text-teal-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-[9px] font-black text-gray-400 mt-3 uppercase tracking-widest leading-none">Capture</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Identity Display Name</label>
              <input
                required
                className="neo-input w-full rounded-2xl px-6 py-4 text-sm font-bold"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Access Credential ID</label>
              <input
                required
                className="neo-input w-full rounded-2xl px-6 py-4 text-sm font-bold opacity-80"
                value={formData.id === storedAdminPass ? '••••••••' : formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                disabled={!!initialData}
                placeholder="Unique Identifier"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Permissions</label>
                <div className="relative">
                  <select
                    className="neo-input w-full rounded-2xl px-6 py-4 text-sm font-bold cursor-pointer appearance-none"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="USTHAD">Usthad</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1">Class / Unit</label>
                <input
                  className="neo-input w-full rounded-2xl px-6 py-4 text-sm font-bold"
                  placeholder="e.g. Unit 4B"
                  value={formData.class}
                  onChange={e => setFormData({ ...formData, class: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-8 flex justify-end gap-4 border-t border-white/40">
            <button type="button" onClick={onClose} className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors tracking-widest">Discard</button>
            <button type="submit" className="accent-teal shadow-[0_10px_20px_rgba(155,194,185,0.3)] hover:scale-[1.02] px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
              {initialData ? 'Patch Profile' : 'Commit Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
