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

  const GlassInput = ({ label, ...props }: any) => (
    <div>
      <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 px-1">{label}</label>
      <input
        {...props}
        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white placeholder:text-zinc-800 focus:bg-white/[0.05] focus:glow-emerald outline-none transition-all"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-700" onClick={onClose}></div>
      <div className="relative w-full max-w-md glass-main border-white/5 rounded-[3.5rem] overflow-hidden animate-in zoom-in duration-500 flex flex-col shadow-[0_0_100px_-20px_rgba(0,0,0,1)]">
        <div className="px-10 py-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
          <h3 className="font-black text-[10px] text-zinc-400 uppercase tracking-[0.4em]">{initialData ? 'Update Identity' : 'Register Identity'}</h3>
          <button onClick={onClose} className="p-3 glass-card rounded-full text-zinc-600 hover:text-white transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="flex justify-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 rounded-full glass-card border-white/10 flex items-center justify-center cursor-pointer overflow-hidden group hover:glow-emerald transition-all relative"
            >
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="text-center">
                  <svg className="w-10 h-10 text-zinc-700 mx-auto group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest mt-2 group-hover:text-emerald-500 transition-colors">Upload</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="space-y-6">
            <GlassInput label="Full Designation" required value={formData.name} onChange={(e: any) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter identity label..." />

            <GlassInput
              label="Identity Hash"
              required
              value={formData.id === storedAdminPass ? '••••••••' : formData.id}
              onChange={(e: any) => setFormData({ ...formData, id: e.target.value })}
              disabled={!!initialData}
              placeholder="Unique system descriptor"
              style={{ fontFamily: 'monospace' }}
            />

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[8px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 px-1">Privilege</label>
                <select
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-6 py-4 text-sm text-white focus:bg-white/[0.05] focus:glow-emerald outline-none transition-all cursor-pointer appearance-none uppercase font-black text-[10px] tracking-widest"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                >
                  <option value="STUDENT">Student</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <GlassInput label="Cluster Link" placeholder="e.g. Node 10A" value={formData.class} onChange={(e: any) => setFormData({ ...formData, class: e.target.value })} />
            </div>
          </div>

          <div className="pt-10 flex justify-end gap-6 border-t border-white/5">
            <button type="button" onClick={onClose} className="px-6 text-[10px] font-black text-zinc-600 hover:text-white transition-all uppercase tracking-[0.3em]">Discard</button>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all glow-emerald shadow-xl shadow-emerald-900/20 active:scale-[0.97]">
              {initialData ? 'Commit Sync' : 'Initialize Node'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
