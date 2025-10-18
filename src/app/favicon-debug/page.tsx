import Head from 'next/head';

export default function FaviconDebug() {
  return (
    <>
      <Head>
        <title>Favicon Debug</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </Head>
      
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Favicon Debug Page</h1>
        <p className="mb-4">This page has explicit favicon links in the head. Check your browser tab for the favicon.</p>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold mb-2">Debug Steps:</h2>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Check if favicon appears in browser tab</li>
            <li>Open Developer Tools (F12)</li>
            <li>Go to Elements tab and look for &lt;head&gt; section</li>
            <li>Check if favicon links are present</li>
            <li>Go to Network tab and refresh page</li>
            <li>Look for favicon requests and their status codes</li>
          </ol>
        </div>
      </div>
    </>
  );
}
