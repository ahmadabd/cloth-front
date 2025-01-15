import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-green-50 to-blue-50">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-green-700">Virtual Wardrobe</h1>
            </div>
            <div className="flex items-center">
              <Link 
                href="/auth/signin"
                className="ml-4 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="max-w-3xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-green-800">
            Transform Your Fashion Experience
          </h2>
          <p className="text-xl text-blue-700 mb-8">
            Upload your clothing photos and let our AI create stunning outfit combinations. 
            Get personalized fashion recommendations based on your style preferences and body type.
          </p>
          <Link 
            href="/auth/signin"
            className="inline-block px-8 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-lg shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}
