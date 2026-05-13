import { FormEvent, useState } from 'react';
import { apiRequest, apiUpload } from '../api/client';

export function AdminPage() {
  const [adminKey, setAdminKey] = useState('admin-import-key');
  const [jsonText, setJsonText] = useState('{"puzzles": []}');
  const [pgnText, setPgnText] = useState('');
  const [message, setMessage] = useState('');

  const importJson = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      const payload = JSON.parse(jsonText);
      const result = await apiRequest<{ imported: number }>('/api/admin/import/json', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: JSON.stringify(payload)
      });
      setMessage(`JSON import complete: ${result.imported} puzzles`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'JSON import failed');
    }
  };

  const importPgn = async (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    try {
      const form = new FormData();
      form.append('pgn', pgnText);
      const result = await apiUpload<{ imported: number }>('/api/admin/import/pgn', form, null, { 'x-admin-key': adminKey });
      setMessage(`PGN import complete: ${result.imported} puzzles`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'PGN import failed');
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="panel p-5">
        <h1 className="text-xl font-semibold text-slate-100">Admin Import</h1>
        <label className="mt-3 block text-sm text-slate-300">
          Admin key
          <input className="mt-1 w-full rounded-lg border border-slate-600/70 bg-slate-900/80 px-3 py-2" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} />
        </label>

        <form onSubmit={importJson} className="mt-4 grid gap-2">
          <p className="text-sm text-slate-300">Import puzzle JSON</p>
          <textarea className="h-52 rounded-lg border border-slate-600/70 bg-slate-900/80 p-2 text-xs" value={jsonText} onChange={(e) => setJsonText(e.target.value)} />
          <button className="btn-primary" type="submit">Import JSON</button>
        </form>
      </article>

      <article className="panel p-5">
        <form onSubmit={importPgn} className="grid gap-2">
          <p className="text-sm text-slate-300">Convert PGN to puzzles (prototype converter)</p>
          <textarea className="h-52 rounded-lg border border-slate-600/70 bg-slate-900/80 p-2 text-xs" value={pgnText} onChange={(e) => setPgnText(e.target.value)} placeholder="Paste PGN text" />
          <button className="btn-primary" type="submit">Import PGN</button>
        </form>
        {message ? <p className="mt-3 text-sm text-cyan-300">{message}</p> : null}
      </article>
    </section>
  );
}
