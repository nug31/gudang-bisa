import React, { useState } from 'react';
import { Button } from './ui/Button';
import { DatabaseIcon, RefreshCw } from 'lucide-react';

export const DatabaseTestButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testDatabase = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First try the test-inventory endpoint
      const response = await fetch('/db/test-inventory');
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
      console.log('Database test result:', data);
    } catch (err) {
      console.error('Error testing database:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      
      // Try fallback to regular inventory endpoint
      try {
        const fallbackResponse = await fetch('/db/inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'getAll'
          }),
        });
        
        if (!fallbackResponse.ok) {
          throw new Error(`Fallback responded with status: ${fallbackResponse.status}`);
        }
        
        const fallbackData = await fallbackResponse.json();
        setResult({
          fallbackTest: true,
          itemsCount: fallbackData.items?.length || 0,
          success: fallbackData.success,
          timestamp: new Date().toISOString()
        });
      } catch (fallbackErr) {
        console.error('Fallback test also failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={testDatabase}
        disabled={loading}
        leftIcon={loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <DatabaseIcon className="h-4 w-4" />}
        variant="outline"
      >
        {loading ? 'Testing...' : 'Test Database Connection'}
      </Button>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          <p className="font-medium">Error testing database:</p>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-sm">
          <p className="font-medium">Database Test Results:</p>
          <pre className="mt-2 text-xs overflow-auto max-h-60">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
