"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from '@/lib/supabase';

export default function Upload() {
  const router = useRouter();
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string>("");
  const [preview2, setPreview2] = useState<string>("");
  const [resultImage, setResultImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/signin');
      }
    };
    checkSession();
  }, [router]);

  const handleImage1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage1(file);
      setPreview1(URL.createObjectURL(file));
    }
  };

  const handleImage2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage2(file);
      setPreview2(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image1 || !image2) {
      setError("Please select both images");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Upload images to Supabase
      const uploadImage = async (image: File, index: number) => {
        const fileExt = image.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}-${index}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('clothes')
          .upload(fileName, image);

        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('clothes')
          .getPublicUrl(fileName);

        return publicUrl;
      };

      const [url1, url2] = await Promise.all([
        uploadImage(image1, 1),
        uploadImage(image2, 2)
      ]);

      // TODO: Replace with your API endpoint
      // const response = await fetch('YOUR_API_ENDPOINT', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     image1: url1,
      //     image2: url2,
      //   }),
      // });
      // const data = await response.json();
      // setResultImage(data.resultImage);

      setResultImage(url1); // Temporary: just show the first uploaded image
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Upload Your Clothes</h1>
        <p className="text-gray-600 mb-6 text-center">Please upload both images</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded text-center">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-8">
            {/* First Image Upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-green-300 p-4 rounded-lg text-center">
                <input
                  type="file"
                  onChange={handleImage1Change}
                  accept="image/*"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2">First Image</p>
              </div>
              {preview1 && (
                <div className="w-[100px] h-[100px] relative mx-auto">
                  <Image
                    src={preview1}
                    alt="Preview 1"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Second Image Upload */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-green-300 p-4 rounded-lg text-center">
                <input
                  type="file"
                  onChange={handleImage2Change}
                  accept="image/*"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2">Second Image</p>
              </div>
              {preview2 && (
                <div className="w-[100px] h-[100px] relative mx-auto">
                  <Image
                    src={preview2}
                    alt="Preview 2"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !image1 || !image2}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : 'Process Images'}
          </button>
        </form>

        {resultImage && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-center">Result</h2>
            <div className="w-[100px] h-[100px] relative mx-auto bg-gray-100 rounded-lg overflow-hidden">
              <Image
                src={resultImage}
                alt="Processed Result"
                fill
                className="object-cover rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 