
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-lg">{initialData ? 'Edit Account' : 'Register User'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-all text-zinc-500 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex flex-col items-center mb-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-2xl bg-zinc-950 border-2 border-dashed border-zinc-800 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-emerald-500/50 transition-all shadow-inner"
            >
              {formData.avatarUrl ? (
                <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <svg className="w-8 h-8 text-zinc-700 mx-auto group-hover:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-[8px] font-black uppercase text-zinc-600 mt-1">Upload Photo</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Full Name</label>
            <input 
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Unique ID</label>
            <input 
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
              value={formData.id}
              onChange={e => setFormData({ ...formData, id: e.target.value })}
              disabled={!!initialData}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">System Role</label>
            <select 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
            >
              <option value="STUDENT">Student / Staff</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Class / Department</label>
            <input 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
              placeholder="e.g. 10th Grade / Physics Dept"
              value={formData.class}
              onChange={e => setFormData({ ...formData, class: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-bold text-zinc-500 hover:text-white transition-all">Cancel</button>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2 rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-900/10">
              {initialData ? 'Update Profile' : 'Register User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
