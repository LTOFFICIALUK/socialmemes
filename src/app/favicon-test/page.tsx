export default function FaviconTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Favicon Debug Test</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Direct Favicon Links:</h2>
          <ul className="space-y-2">
            <li>
              <a href="/favicon.ico" target="_blank" className="text-blue-500 hover:underline">
                /favicon.ico
              </a>
            </li>
            <li>
              <a href="/favicon-16x16.png" target="_blank" className="text-blue-500 hover:underline">
                /favicon-16x16.png
              </a>
            </li>
            <li>
              <a href="/favicon-32x32.png" target="_blank" className="text-blue-500 hover:underline">
                /favicon-32x32.png
              </a>
            </li>
            <li>
              <a href="/apple-touch-icon.png" target="_blank" className="text-blue-500 hover:underline">
                /apple-touch-icon.png
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Favicon Images:</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>favicon.ico:</p>
              <img src="/favicon.ico" alt="favicon" className="w-16 h-16 border" />
            </div>
            <div>
              <p>favicon-16x16.png:</p>
              <img src="/favicon-16x16.png" alt="favicon 16x16" className="w-16 h-16 border" />
            </div>
            <div>
              <p>favicon-32x32.png:</p>
              <img src="/favicon-32x32.png" alt="favicon 32x32" className="w-16 h-16 border" />
            </div>
            <div>
              <p>apple-touch-icon.png:</p>
              <img src="/apple-touch-icon.png" alt="apple touch icon" className="w-16 h-16 border" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click each link above to test if the favicon files are accessible</li>
            <li>Check if the images display correctly below</li>
            <li>Open browser developer tools (F12) and check the Network tab for any 404 errors</li>
            <li>Look at the Console tab for any favicon-related errors</li>
            <li>Check the Elements tab to see what favicon links are in the HTML head</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
