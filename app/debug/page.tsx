'use client';

export default function DebugPage() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Firebase 설정 디버그</h1>

      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">환경 변수 상태:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(firebaseConfig, null, 2)}
        </pre>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">체크리스트:</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>API Key 존재: {firebaseConfig.apiKey ? '✅' : '❌'}</li>
          <li>Auth Domain 존재: {firebaseConfig.authDomain ? '✅' : '❌'}</li>
          <li>Project ID 존재: {firebaseConfig.projectId ? '✅' : '❌'}</li>
          <li>
            Storage Bucket 존재: {firebaseConfig.storageBucket ? '✅' : '❌'}
          </li>
          <li>
            Messaging Sender ID 존재:{' '}
            {firebaseConfig.messagingSenderId ? '✅' : '❌'}
          </li>
          <li>App ID 존재: {firebaseConfig.appId ? '✅' : '❌'}</li>
        </ul>
      </div>

      <div className="mt-8 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
        <p className="text-sm">
          <strong>참고:</strong> GitHub Pages에서는 환경 변수가 빌드 시점에
          주입됩니다. 로컬에서는 .env.local 파일의 값을 사용합니다.
        </p>
      </div>
    </div>
  );
}
