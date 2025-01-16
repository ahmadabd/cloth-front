"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from '@/lib/supabase';

export default function Upload() {
  const router = useRouter();
  const [manImage, setManImage] = useState<File | null>(null);
  const [clothImage, setClothImage] = useState<File | null>(null);
  const [manPreview, setManPreview] = useState<string>("");
  const [clothPreview, setClothPreview] = useState<string>("");
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

  const handleManImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setManImage(file);
      setManPreview(URL.createObjectURL(file));
    }
  };

  const handleClothImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setClothImage(file);
      setClothPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manImage || !clothImage) {
      setError("Please select both images");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const uploadImage = async (image: File, index: number) => {
        try {
          const fileExt = image.name.split('.').pop();
          const fileName = `${session.user.id}/${Date.now()}-${index}.${fileExt}`;
          
          const { data, error } = await supabase.storage
            .from('clothes')
            .upload(fileName, image);

          if (error) {
            console.error('Upload error:', error);
            throw new Error(`Failed to upload image ${index}: ${error.message}`);
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('clothes')
            .getPublicUrl(fileName);

          return publicUrl;
        } catch (err) {
          console.error(`Error uploading image ${index}:`, err);
          throw err;
        }
      };

      const [url1, url2] = await Promise.all([
        uploadImage(manImage, 1),
        uploadImage(clothImage, 2)
      ]);

      console.log('Sending request with URLs:', { url1, url2 });
      
      const functionBody = {
        image1: url1,
        image2: url2
      };
      console.log('Request body:', functionBody);

      const { data, error } = await supabase.functions.invoke(
        'process-images',
        {
          body: functionBody,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          }
        }
      );

      console.log('Response:', { data, error });

      if (error) {
        console.error('Processing error:', error);
        throw new Error(`Failed to process images: ${error.message}`);
      }

      if (!data?.resultImage) {
        throw new Error('No result image received from processing');
      }

      setResultImage(data.resultImage);
    } catch (err: any) {
      setError(err.message);
      console.error('Error processing images:', err);
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

          <div className="flex flex-col items-center space-y-8">
            {/* Man Image Upload */}
            <div className="w-full max-w-md">
              <div className="border-2 border-dashed border-green-300 p-4 rounded-lg">
                <input
                  type="file"
                  onChange={handleManImageChange}
                  accept="image/*"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2 text-center">Upload Person Image</p>
              </div>
              {manPreview && (
                <div className="mt-4 mx-auto" style={{ width: '192px', height: '192px', position: 'relative' }}>
                  <Image
                    src={manPreview}
                    alt="Person Preview"
                    width={192}
                    height={192}
                    style={{
                      width: '192px',
                      height: '192px',
                      objectFit: 'contain',
                      borderRadius: '0.5rem'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Cloth Image Upload */}
            <div className="w-full max-w-md">
              <div className="border-2 border-dashed border-green-300 p-4 rounded-lg">
                <input
                  type="file"
                  onChange={handleClothImageChange}
                  accept="image/*"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2 text-center">Upload Clothing Image</p>
              </div>
              {clothPreview && (
                <div className="mt-4 mx-auto" style={{ width: '192px', height: '192px', position: 'relative' }}>
                  <Image
                    src={clothPreview}
                    alt="Clothing Preview"
                    width={192}
                    height={192}
                    style={{
                      width: '192px',
                      height: '192px',
                      objectFit: 'contain',
                      borderRadius: '0.5rem'
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !manImage || !clothImage}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processing...' : 'Process Images'}
          </button>
        </form>

        {resultImage && (
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-center">Result</h2>
            <div className="mx-auto" style={{ width: '192px', height: '192px', position: 'relative' }}>
              <Image
                src={resultImage}
                alt="Processed Result"
                width={192}
                height={192}
                style={{
                  width: '192px',
                  height: '192px',
                  objectFit: 'contain',
                  borderRadius: '0.5rem'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}