import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Initialize dark mode and key pair
  useEffect(() => {
    // Set initial theme
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }

    // Generate initial key pair
    const keys = generateKeyPair();
    setKeyPair(keys);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = () => {
    const root = document.documentElement;
    setIsDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        root.classList.remove('light');
      } else {
        root.classList.add('light');
      }
      return newMode;
    });
  };

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
      did: {
        actor: 'did:example:user',
        action: 'create'
      },
    });
    setAtomicJson(JSON.stringify(atomic, null, 2));
    setOutput('');
    setError('');
    setValidationErrors([]);
  };

  const handleEditorMount = (editor: editor.IStandaloneCodeEditor) => {
    // Define custom Monaco theme
    const monaco = (window as any).monaco;
    if (monaco) {
      monaco.editor.defineTheme('jsonatomic-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'string.key.json', foreground: '6E56CF' },
          { token: 'string.value.json', foreground: 'A78BFA' },
          { token: 'number', foreground: '8B5CF6' },
        ],
        colors: {
          'editor.background': '#0f111a',
          'editor.lineHighlightBackground': '#1a1d29',
          'editorLineNumber.foreground': '#4B5563',
          'editor.selectionBackground': '#6E56CF40',
        },
      });

      monaco.editor.defineTheme('jsonatomic-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'string.key.json', foreground: '6E56CF' },
          { token: 'string.value.json', foreground: '8B5CF6' },
          { token: 'number', foreground: 'A78BFA' },
        ],
        colors: {
          'editor.background': '#f5f7fb',
          'editor.lineHighlightBackground': '#EDE9FE',
          'editorLineNumber.foreground': '#9CA3AF',
          'editor.selectionBackground': '#6E56CF20',
        },
      });

      editor.updateOptions({ theme: isDarkMode ? 'jsonatomic-dark' : 'jsonatomic-light' });
    }
  };

  return (
    <div className="h-full grid grid-rows-[auto,1fr]">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-[var(--border)] sticky top-0 z-10 bg-[var(--bg)] backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-glow">
            <span className="text-2xl font-bold text-white">✯</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
              Json✯Atomic Playground
            </h1>
            <p className="text-xs text-muted">Cryptographic ledger platform</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="btn btn-ghost text-sm" 
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
            <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>
          <a
            href="https://github.com/danvoulez/JsonAtomic"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost text-sm"
            aria-label="View on GitHub"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="grid xl:grid-cols-[1fr,420px] gap-4 p-4 overflow-hidden">
        {/* Left: Monaco Editor */}
        <section className="monaco-wrap flex flex-col">
          <div className="monaco-toolbar">
            <span className="text-sm text-muted">Editor</span>
            <div className="flex gap-2">
              <button onClick={() => setAtomicJson(JSON.stringify(JSON.parse(atomicJson), null, 2))} className="btn btn-ghost text-xs">
                Format
              </button>
              <button onClick={handleNewAtomic} className="btn btn-ghost text-xs">
                New
              </button>
              <label className="btn btn-ghost text-xs cursor-pointer">
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button onClick={handleExport} className="btn btn-ghost text-xs">
                Export
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="json"
              value={atomicJson}
              onChange={(value) => setAtomicJson(value || '')}
              onMount={handleEditorMount}
              theme={isDarkMode ? 'jsonatomic-dark' : 'jsonatomic-light'}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'var(--font-mono), monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
              }}
            />
          </div>
        </section>

        {/* Right: Actions & Results */}
        <aside className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Examples */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-2">Examples</h2>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(examples).map(([key, example]) => (
                <button
                  key={key}
                  onClick={() => handleLoadExample(key as ExampleKey)}
                  className={`px-3 py-2 text-xs rounded-lg transition-all text-left ${
                    selectedExample === key
                      ? 'bg-brand-600 text-white shadow-glow'
                      : 'bg-white/5 hover:bg-white/10 light:bg-black/5 light:hover:bg-black/10'
                  }`}
                >
                  <div className="font-medium">{example.name}</div>
                  <div className="opacity-75 mt-0.5 text-[10px]">{example.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-3">Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleValidate} className="btn btn-primary text-sm">
                Validate
              </button>
              <button onClick={handleCanonicalize} className="btn btn-secondary text-sm">
                Canonicalize
              </button>
              <button onClick={handleHash} className="btn btn-secondary text-sm">
                Hash
              </button>
              <button onClick={handleSign} className="btn btn-primary text-sm">
                Sign
              </button>
            </div>
          </div>

          {/* Verify Signature */}
          <div className="card">
            <h2 className="text-sm font-semibold mb-2">Verify Signature</h2>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Public key (optional, uses generated key)"
                value={publicKeyInput}
                onChange={(e) => setPublicKeyInput(e.target.value)}
                className="input text-xs"
              />
              <button onClick={handleVerify} className="btn btn-primary w-full text-sm">
                Verify
              </button>
            </div>
          </div>

          {/* Cryptographic Keys */}
          {keyPair && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">Keys</h2>
                <button
                  onClick={() => setKeyPair(generateKeyPair())}
                  className="btn btn-ghost text-xs"
                >
                  Regenerate
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted">Public Key</label>
                  <div className="bg-white/5 light:bg-black/5 rounded px-2 py-1.5 font-mono text-[10px] overflow-x-auto">
                    {keyPair.publicKey}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted">Private Key</label>
                  <div className="bg-white/5 light:bg-black/5 rounded px-2 py-1.5 font-mono text-[10px] overflow-x-auto">
                    {keyPair.privateKey}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="card bg-red-900/20 ring-red-800/50">
              <h3 className="text-sm font-semibold text-red-400 mb-2">Validation Errors</h3>
              <div className="space-y-1">
                {validationErrors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="text-red-400">•</span>
                    <div>
                      <span className="text-red-300 font-mono">{err.field}</span>
                      <span className="text-gray-400">: {err.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card bg-red-900/20 ring-red-800/50">
              <div className="flex items-start gap-2">
                <span className="text-red-400 text-lg">⚠</span>
                <div>
                  <h3 className="text-sm font-semibold text-red-400 mb-1">Error</h3>
                  <p className="text-xs text-gray-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Output */}
          {output && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-2">Result</h3>
              <div className="bg-[var(--panel)] rounded-lg p-3 ring-1 ring-white/5 light:ring-black/10">
                <pre className="font-mono text-[10px] whitespace-pre-wrap break-all leading-relaxed">
                  {output}
                </pre>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="card bg-brand-900/10 ring-brand-800/30">
            <h3 className="text-sm font-semibold text-brand-400 mb-2">About Json✯Atomic</h3>
            <div className="text-xs text-muted space-y-2">
              <p>
                Ledger-based constitutional governance platform with cryptographic integrity.
              </p>
              <div className="flex flex-wrap gap-1">
                <span className="badge badge-success">BLAKE3</span>
                <span className="badge badge-success">Ed25519</span>
                <span className="badge badge-info">Browser-only</span>
                <span className="badge badge-info">No server</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
