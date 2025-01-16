"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Outfit {
  id: number;
  user_id: string;
  man_image_path: string;
  cloth_image_path: string;
  result_image_path: string;
  created_at: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/signin');
          return;
        }

        // Check if user has profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        if (!profile) {
          router.push('/profile/setup');
          return;
        }

        // Fetch outfits
        const { data: outfitsData, error: outfitsError } = await supabase
          .from('outfits')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (outfitsError) {
          throw outfitsError;
        }

        setOutfits(outfitsData || []);
        setIsLoading(false);
      } catch (error: any) {
        console.error('Error:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    checkUserAndFetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            Error: {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Your Outfit History</h1>
          <button
            onClick={() => router.push('/upload')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create New Outfit
          </button>
        </div>

        {outfits.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">You haven't created any outfits yet.</p>
            <button
              onClick={() => router.push('/upload')}
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Create Your First Outfit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outfits.map((outfit) => (
              <div key={outfit.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4">
                  <div className="text-sm text-gray-500 mb-4">
                    Created: {new Date(outfit.created_at).toLocaleDateString()}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative h-32">
                      <Image
                        src={outfit.man_image_path}
                        alt="Person"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="relative h-32">
                      <Image
                        src={outfit.cloth_image_path}
                        alt="Clothing"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                    <div className="relative h-32">
                      <Image
                        src={outfit.result_image_path}
                        alt="Result"
                        fill
                        className="object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 