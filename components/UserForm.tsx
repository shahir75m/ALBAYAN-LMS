
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[100] p-4">
      <div className="bg-[#0c0c0e] border border-zinc-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="px-6 py-4 border-b border-zinc-900 bg-zinc-900/10 flex justify-between items-center">
          <h3 className="font-semibold text-sm text-white/90">{initialData ? 'Update Profile' : 'Register User'}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg transition-all text-zinc-500 hover:text-zinc-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex justify-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-zinc-700 transition-all shadow-inner"
            >
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <svg className="w-6 h-6 text-zinc-700 mx-auto group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-[9px] font-medium text-zinc-600 mt-1 uppercase tracking-tight">Avatar</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Full Legal Name</label>
              <input
                required
                className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none text-white/90 transition-all"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Identity / Access ID</label>
              <input
                required
                className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none font-mono text-white/90 transition-all disabled:opacity-50"
                value={formData.id === storedAdminPass ? '••••••••' : formData.id}
                onChange={e => setFormData({ ...formData, id: e.target.value })}
                disabled={!!initialData}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Role</label>
                <select
                  className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none text-white/90 transition-all cursor-pointer"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Class</label>
                <input
                  className="w-full bg-[#09090b] border border-zinc-900 rounded-xl px-4 py-2.5 text-sm focus:border-zinc-700 outline-none text-white/90 transition-all"
                  placeholder="e.g. Grade 10A"
                  value={formData.class}
                  onChange={e => setFormData({ ...formData, class: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 bg-[#0c0c0e]">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">Discard</button>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl text-xs font-medium transition-all shadow-lg shadow-emerald-900/10 active:scale-95">
              {initialData ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
