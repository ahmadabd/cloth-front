"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from '@/lib/supabase';

interface ClothImage {
  id: number;
  url: string;
  created_at: string;
}

interface Profile {
  image_url: string;
}

export default function Upload() {
  const router = useRouter();
  const [clothImage, setClothImage] = useState<File | null>(null);
  const [clothPreview, setClothPreview] = useState<string>("");
  const [resultImage, setResultImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clothImages, setClothImages] = useState<ClothImage[]>([]);
  const [selectedClothImage, setSelectedClothImage] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const checkSessionAndLoadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth/signin');
          return;
        }

        // Load user's profile image
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('image_url')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          console.error('Error loading profile:', profileError);
          if (profileError.code === 'PGRST116') {
            router.push('/profile/setup');
            return;
          }
        }

        if (profile?.image_url) {
          setProfileImage(profile.image_url);
        } else {
          router.push('/profile/setup');
          return;
        }

        // Load user's cloth images
        const { data: clothes, error: clothesError } = await supabase
          .from('clothes')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (clothesError) {
          throw clothesError;
        }

        setClothImages(clothes || []);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message);
      }
    };

    checkSessionAndLoadData();
  }, [router]);

  const handleClothImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setClothImage(file);
      setClothPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadCloth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clothImage) {
      setError("Please select an image");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const fileExt = clothImage.name.split('.').pop();
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('clothes')
        .upload(fileName, clothImage);

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('clothes')
        .getPublicUrl(fileName);

      // Save to clothes table
      const { error: dbError } = await supabase
        .from('clothes')
        .insert([{
          user_id: session.user.id,
          url: publicUrl
        }]);

      if (dbError) throw dbError;

      // Refresh clothes list
      const { data: clothes, error: clothesError } = await supabase
        .from('clothes')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (clothesError) throw clothesError;

      setClothImages(clothes || []);
      setClothImage(null);
      setClothPreview("");
    } catch (err: any) {
      setError(err.message);
      console.error('Error uploading cloth:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessImages = async () => {
    if (!selectedClothImage || !profileImage) {
      setError("Please select a cloth image");
      return;
    }

    // Prevent duplicate submissions while processing
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(""); // Clear previous result

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const functionsUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
      if (!functionsUrl) {
        throw new Error('Supabase Functions URL not configured');
      }

      const response = await fetch(`${functionsUrl}/process-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image1: profileImage,
          image2: selectedClothImage
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process images');
      }

      const data = await response.json();

      if (!data?.resultImage) {
        throw new Error('No result image received from processing');
      }

      setResultImage(data.resultImage);

      // Store the result in the outfits table using upsert
      const { error: outfitError } = await supabase
        .from('outfits')
        .upsert(
          {
            user_id: session.user.id,
            man_image_path: profileImage,
            cloth_image_path: selectedClothImage,
            result_image_path: data.resultImage,
            created_at: new Date().toISOString()
          },
          {
            onConflict: 'user_id,man_image_path,cloth_image_path',
            ignoreDuplicates: true
          }
        );

      if (outfitError) {
        console.error('Error saving outfit:', outfitError);
      }

    } catch (err: any) {
      setError(err.message);
      console.error('Error processing images:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Image Display */}
        {profileImage && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Your Profile Image</h2>
            <div className="relative h-48 w-48 mx-auto">
              <Image
                src={profileImage}
                alt="Profile"
                fill
                className="object-cover rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        )}

        {/* Upload New Cloth */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Upload New Cloth</h2>
          <form onSubmit={handleUploadCloth} className="space-y-4">
            {error && (
              <div className="text-red-600 bg-red-50 p-3 rounded text-center">
                {error}
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                onChange={handleClothImageChange}
                accept="image/*"
                className="w-full"
              />
            </div>

            {clothPreview && (
              <div className="relative h-48 w-48 mx-auto">
                <Image
                  src={clothPreview}
                  alt="Cloth Preview"
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !clothImage}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Uploading...' : 'Upload Cloth'}
            </button>
          </form>
        </div>

        {/* Cloth Images Grid */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Your Clothes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {clothImages.map((cloth) => (
              <div
                key={cloth.id}
                className={`relative h-48 cursor-pointer ${
                  selectedClothImage === cloth.url ? 'ring-4 ring-green-500' : ''
                }`}
                onClick={() => setSelectedClothImage(cloth.url)}
              >
                <Image
                  src={cloth.url}
                  alt="Cloth"
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            ))}
          </div>

          {clothImages.length > 0 && (
            <button
              onClick={handleProcessImages}
              disabled={isLoading || !selectedClothImage}
              className="mt-6 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Process Selected Image'}
            </button>
          )}
        </div>

        {/* Result Image */}
        {resultImage && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Result</h2>
            <div className="relative h-96 w-full">
              <Image
                src={resultImage}
                alt="Result"
                fill
                className="object-contain rounded-lg"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}