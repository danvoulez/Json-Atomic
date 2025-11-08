import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Atomic, 
  canonicalize, 
  hashAtomic, 
  signAtomic, 
  verifySignature, 
  validateAtomic, 
  generateKeyPair,
  createAtomic,
  ValidationError 
} from './lib/jsonatomic';
import { examples, ExampleKey } from './examples/atomics';

interface KeyPair {
  privateKey: string;
  publicKey: string;
}

function App() {
  const [atomicJson, setAtomicJson] = useState<string>(JSON.stringify(examples.simple.atomic, null, 2));
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [publicKeyInput, setPublicKeyInput] = useState<string>('');
  const [selectedExample, setSelectedExample] = useState<ExampleKey>('simple');

  // Generate initial key pair
  useEffect(() => {
    const keys = generateKeyPair();
    setKeyPair(keys);
  }, []);

  const parseAtomic = (): Atomic | null => {
    try {
      const atomic = JSON.parse(atomicJson);
      return atomic;
    } catch (e) {
      setError(`Invalid JSON: ${(e as Error).message}`);
      return null;
    }
  };

  const handleValidate = () => {
    const atomic = parseAtomic();
    if (!atomic) return;

    const errors = validateAtomic(atomic);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      setOutput('✅ Atomic is valid!');
      setError('');
    } else {
      setError('Validation failed');
      setOutput('');
    }
  };

  const handleCanonicalize = () => {
    const atomic = parseAtomic();
    if (!atomic) return;

    try {
      const canonical = canonicalize(atomic);
      setOutput(canonical);
      setError('');
      setValidationErrors([]);
    } catch (e) {
      setError(`Canonicalization error: ${(e as Error).message}`);
    }
  };

  const handleHash = () => {
    const atomic = parseAtomic();
    if (!atomic) return;

    try {
      const hash = hashAtomic(atomic);
      setOutput(hash);
      setError('');
      setValidationErrors([]);
    } catch (e) {
      setError(`Hashing error: ${(e as Error).message}`);
    }
  };

  const handleSign = () => {
    const atomic = parseAtomic();
    if (!atomic || !keyPair) return;

    try {
      const signed = signAtomic(atomic, keyPair.privateKey);
      setAtomicJson(JSON.stringify(signed, null, 2));
      setOutput('Atomic signed successfully!');
      setError('');
      setValidationErrors([]);
    } catch (e) {
      setError(`Signing error: ${(e as Error).message}`);
    }
  };

  const handleVerify = () => {
    const atomic = parseAtomic();
    if (!atomic) return;

    const pubKey = publicKeyInput || keyPair?.publicKey || '';
    if (!pubKey) {
      setError('Please provide a public key');
      return;
    }

    try {
      const isValid = verifySignature(atomic, pubKey);
      if (isValid) {
        setOutput('✅ Signature is valid!');
        setError('');
      } else {
        setOutput('❌ Signature is invalid!');
        setError('');
      }
      setValidationErrors([]);
    } catch (e) {
      setError(`Verification error: ${(e as Error).message}`);
    }
  };

  const handleLoadExample = (key: ExampleKey) => {
    setSelectedExample(key);
    setAtomicJson(JSON.stringify(examples[key].atomic, null, 2));
    setOutput('');
    setError('');
    setValidationErrors([]);
  };

  const handleExport = () => {
    const atomic = parseAtomic();
    if (!atomic) return;

    const blob = new Blob([JSON.stringify(atomic, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atomic-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAtomicJson(content);
      setOutput('');
      setError('');
      setValidationErrors([]);
    };
    reader.readAsText(file);
  };

  const handleNewAtomic = () => {
    const atomic = createAtomic({
      entity_type: 'document',
      this: {},
      did: 'did:example:user',
    });
    setAtomicJson(JSON.stringify(atomic, null, 2));
    setOutput('');
    setError('');
    setValidationErrors([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-atomic-500 to-atomic-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-white">✯</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-atomic-400 to-atomic-600 bg-clip-text text-transparent">
                  Json✯Atomic
                </h1>
                <p className="text-xs text-gray-400">Interactive Playground</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <a
                href="https://github.com/danvoulez/JsonAtomic"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Editor */}
          <div className="space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-100">Atomic Editor</h2>
                <div className="flex space-x-2">
                  <button onClick={handleNewAtomic} className="btn-secondary text-sm">
                    New
                  </button>
                  <label className="btn-secondary text-sm cursor-pointer">
                    Import
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                  <button onClick={handleExport} className="btn-secondary text-sm">
                    Export
                  </button>
                </div>
              </div>

              <div className="border border-gray-800 rounded-lg overflow-hidden">
                <Editor
                  height="500px"
                  defaultLanguage="json"
                  value={atomicJson}
                  onChange={(value) => setAtomicJson(value || '')}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: 'JetBrains Mono, monospace',
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>

            {/* Examples */}
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-100 mb-3">Examples</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(examples).map(([key, example]) => (
                  <button
                    key={key}
                    onClick={() => handleLoadExample(key as ExampleKey)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                      selectedExample === key
                        ? 'bg-atomic-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{example.name}</div>
                    <div className="text-xs opacity-75 mt-0.5">{example.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cryptographic Keys */}
            {keyPair && (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-100 mb-3">Cryptographic Keys</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Private Key (keep secret!)</label>
                    <div className="bg-gray-800 rounded px-3 py-2 font-mono text-xs text-gray-300 overflow-x-auto">
                      {keyPair.privateKey}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Public Key</label>
                    <div className="bg-gray-800 rounded px-3 py-2 font-mono text-xs text-gray-300 overflow-x-auto">
                      {keyPair.publicKey}
                    </div>
                  </div>
                  <button
                    onClick={() => setKeyPair(generateKeyPair())}
                    className="btn-secondary text-sm w-full"
                  >
                    Generate New Key Pair
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Actions & Output */}
          <div className="space-y-4">
            {/* Actions */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-100 mb-4">Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleValidate} className="btn-primary">
                  Validate
                </button>
                <button onClick={handleCanonicalize} className="btn-secondary">
                  Canonicalize
                </button>
                <button onClick={handleHash} className="btn-secondary">
                  Hash
                </button>
                <button onClick={handleSign} className="btn-primary">
                  Sign
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800">
                <h3 className="text-sm font-semibold text-gray-100 mb-3">Verify Signature</h3>
                <input
                  type="text"
                  placeholder="Public key (optional, uses generated key)"
                  value={publicKeyInput}
                  onChange={(e) => setPublicKeyInput(e.target.value)}
                  className="input w-full mb-3 text-sm"
                />
                <button onClick={handleVerify} className="btn-primary w-full">
                  Verify
                </button>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="card bg-red-900/20 border-red-800">
                <h3 className="text-sm font-semibold text-red-400 mb-3">Validation Errors</h3>
                <div className="space-y-2">
                  {validationErrors.map((err, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="text-red-400 mt-0.5">•</span>
                      <div>
                        <span className="text-red-300 font-mono text-sm">{err.field}</span>
                        <span className="text-gray-400 text-sm">: {err.message}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="card bg-red-900/20 border-red-800">
                <div className="flex items-start space-x-2">
                  <span className="text-red-400 text-xl">⚠</span>
                  <div>
                    <h3 className="text-sm font-semibold text-red-400 mb-1">Error</h3>
                    <p className="text-sm text-gray-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Output */}
            {output && (
              <div className="card">
                <h3 className="text-sm font-semibold text-gray-100 mb-3">Output</h3>
                <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
                  <pre className="font-mono text-xs text-gray-300 whitespace-pre-wrap break-all">
                    {output}
                  </pre>
                </div>
              </div>
            )}

            {/* Info Card */}
            <div className="card bg-atomic-900/20 border-atomic-800">
              <h3 className="text-sm font-semibold text-atomic-400 mb-3">About Json✯Atomic</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>
                  Json✯Atomic is a ledger-only constitutional governance platform with cryptographic integrity.
                </p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="badge badge-success">BLAKE3</span>
                    <span className="text-gray-400">Cryptographic hashing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="badge badge-success">Ed25519</span>
                    <span className="text-gray-400">Digital signatures</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="badge badge-info">Browser-only</span>
                    <span className="text-gray-400">No server required</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-400">
            <p>
              Built with ❤️ using React, TypeScript, and Vite •{' '}
              <a href="https://github.com/danvoulez/JsonAtomic" className="text-atomic-400 hover:text-atomic-300">
                View on GitHub
              </a>
            </p>
            <p className="mt-2 text-xs">
              Licensed under MIT • Runs entirely in your browser
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
