"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface ProfileData {
  full_name: string;
  gender: string;
  age: string;
  weight: string;
  height: string;
}

export default function ProfileSetup() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileData>({
    full_name: '',
    gender: '',
    age: '',
    weight: '',
    height: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/signin');
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is the "not found" error code
          throw profileError;
        }

        if (profile) {
          setForm({
            full_name: profile.full_name || '',
            gender: profile.gender || '',
            age: profile.age?.toString() || '',
            weight: profile.weight?.toString() || '',
            height: profile.height?.toString() || '',
          });
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new Error('No authenticated user');
      }

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            ...form,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', session.user.id);

        if (updateError) throw updateError;
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              user_id: session.user.id,
              ...form,
              updated_at: new Date().toISOString(),
            }
          ]);

        if (insertError) throw insertError;
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      console.error('Profile setup error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6 bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {form.full_name ? 'Update Your Profile' : 'Complete Your Profile'}
        </h1>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block mb-2">Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          >
            <option value="">Select gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">Age</label>
          <input
            type="number"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Weight (kg)</label>
          <input
            type="number"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Height (cm)</label>
          <input
            type="number"
            value={form.height}
            onChange={(e) => setForm({ ...form, height: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : (form.full_name ? 'Update Profile' : 'Save Profile')}
        </button>
      </form>
    </div>
  );
} 