import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Mail, Save } from 'lucide-react';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onBack: () => void;
  t: any;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, onBack, t }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ ...user, name, email });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="container mx-auto px-6 py-8 animate-fade-in max-w-2xl">
      <h1 className="font-heading text-3xl font-bold text-text mb-8">{t.profileSettings}</h1>

      <div className="bg-surface border border-gray-700 rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-6 mb-8">
          {user.picture ? (
            <img src={user.picture} alt={name} className="w-24 h-24 rounded-full shadow-lg object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-text">{name}</h2>
            <p className="text-gray-400">{user.isGuest ? t.guest : 'Student Account'}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <User className="w-4 h-4" /> {t.fullName}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!user.isGuest} // Google users cannot change name here easily
              className={`w-full bg-background border border-gray-700 rounded-xl p-3 text-text focus:border-primary focus:outline-none transition-colors ${!user.isGuest ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {!user.isGuest && <p className="text-xs text-gray-500">Managed by Google Account</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <Mail className="w-4 h-4" /> {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={true} // Always disabled for now
              className={`w-full bg-background border border-gray-700 rounded-xl p-3 text-text focus:border-primary focus:outline-none transition-colors opacity-50 cursor-not-allowed`}
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 rounded-xl border border-gray-600 text-gray-400 hover:text-text hover:border-gray-400 transition-colors"
            >
              {t.cancel}
            </button>
            {user.isGuest && (
              <button
                type="submit"
                className="flex-1 bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2"
              >
                {isSaved ? 'Saved!' : <><Save className="w-5 h-5" /> {t.saveChanges}</>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};