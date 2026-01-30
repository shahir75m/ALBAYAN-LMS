
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
    <div className="fixed inset-0 bg-white/20 backdrop-blur-2xl flex items-center justify-center z-[100] p-4">
      <div className="glass-panel w-full max-w-lg rounded-[3rem] overflow-hidden animate-in zoom-in-95 duration-300 shadow-[0_32px_128px_rgba(0,0,0,0.1)] border-white/60">
        <div className="px-10 py-8 border-b border-gray-100/50 bg-white/10 flex justify-between items-center shadow-sm">
          <h3 className="font-black text-[11px] text-gray-900 uppercase tracking-[0.25em]">{initialData ? 'Modify Node Profile' : 'Initialize New Access Node'}</h3>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl glass-button flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all border-white shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="flex justify-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-36 h-36 rounded-[3rem] bg-gray-50/50 flex items-center justify-center cursor-pointer overflow-hidden group transition-all relative border-2 border-dashed border-gray-200 hover:border-teal-500/50 hover:bg-teal-500/5 shadow-sm"
            >
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="text-center">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100 group-hover:scale-110 transition-transform">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] leading-none opacity-60">Visual ID</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3 px-1 opacity-60">Full Identity Name</label>
              <input
                required
                className="glass-input w-full rounded-2xl px-6 py-4 text-sm font-black tracking-tight border-gray-100/50 shadow-sm"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="User Full Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3 px-1 opacity-60">Credential Identifier</label>
              <input
                required
                className="glass-input w-full rounded-2xl px-6 py-4 text-sm font-black tracking-[0.2em] border-gray-100/50 shadow-sm opacity-80"
                value={formData.id === storedAdminPass ? '••••••••' : formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                disabled={!!initialData}
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3 px-1 opacity-60">Access Permissions</label>
                <div className="relative">
                  <select
                    className="glass-input w-full rounded-2xl px-6 py-4 text-sm font-black cursor-pointer appearance-none border-gray-100/50 shadow-sm"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                  >
                    <option value="STUDENT">Student Role</option>
                    <option value="USTHAD">Staff (Usthad)</option>
                    <option value="ADMIN">System Admin</option>
                  </select>
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 opacity-60">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-3 px-1 opacity-60">Classification</label>
                <input
                  className="glass-input w-full rounded-2xl px-6 py-4 text-sm font-black border-gray-100/50 shadow-sm"
                  placeholder="e.g. Unit 4B"
                  value={formData.class}
                  onChange={e => setFormData({ ...formData, class: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-12 flex justify-end gap-6 border-t border-gray-100/50">
            <button type="button" onClick={onClose} className="px-8 py-5 text-[10px] font-black uppercase text-gray-400 hover:text-gray-900 transition-colors tracking-[0.3em]">Discard Changes</button>
            <button type="submit" className="bg-teal-600 text-white hover:bg-teal-700 shadow-xl shadow-teal-500/10 px-12 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all">
              {initialData ? 'Update Profile' : 'Initialize Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
