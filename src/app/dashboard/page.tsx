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

interface ImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${alt}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl w-full bg-white rounded-lg overflow-hidden">
        <div className="absolute top-4 right-4 z-10 space-x-2">
          {/* Download button */}
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition-colors"
            title="Download Image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          {/* Close button */}
          <button
            onClick={onClose}
            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
            title="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="relative h-[80vh] w-full">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null);

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {outfits.map((outfit) => (
              <div key={outfit.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-4">
                  <div className="text-sm text-gray-500 mb-4">
                    Created: {new Date(outfit.created_at).toLocaleDateString()}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Original Images */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">Original Images</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div 
                          className="relative h-32 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage({ src: outfit.man_image_path, alt: 'Person' })}
                        >
                          <Image
                            src={outfit.man_image_path}
                            alt="Person"
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                        <div 
                          className="relative h-32 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage({ src: outfit.cloth_image_path, alt: 'Clothing' })}
                        >
                          <Image
                            src={outfit.cloth_image_path}
                            alt="Clothing"
                            fill
                            className="object-cover rounded-lg"
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Result Image */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-gray-700">Result</h3>
                      <div 
                        className="relative h-32 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage({ src: outfit.result_image_path, alt: 'Result' })}
                      >
                        <Image
                          src={outfit.result_image_path}
                          alt="Result"
                          fill
                          className="object-contain rounded-lg"
                          sizes="(max-width: 768px) 100vw, 50vw"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Image Viewer Modal */}
        {selectedImage && (
          <ImageViewer
            src={selectedImage.src}
            alt={selectedImage.alt}
            onClose={() => setSelectedImage(null)}
          />
        )}
      </div>
    </div>
  );
} 