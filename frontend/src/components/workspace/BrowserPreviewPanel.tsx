import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ExternalLink, Play, Square, Loader } from 'lucide-react';
import { webProjectApi, WebProjectStatus } from '../../services/webProjectApi';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface BrowserPreviewPanelProps {
  projectId: string;
}

export function BrowserPreviewPanel({ projectId }: BrowserPreviewPanelProps) {
  const [status, setStatus] = useState<WebProjectStatus>({ status: 'STOPPED', port: null });
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');
  const [key, setKey] = useState(0);
  const [waitingForReady, setWaitingForReady] = useState(false);
  const [readyMessage, setReadyMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => {
      clearInterval(interval);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [projectId]);

  useEffect(() => {
    if (status.status === 'RUNNING' && status.port && !waitingForReady) {
      setUrl(`http://localhost:${status.port}`);
    } else if (status.status === 'STOPPED') {
      setUrl('');
    }
  }, [status, waitingForReady]);

  const checkStatus = async () => {
    try {
      const current = await webProjectApi.getStatus(projectId);
      setStatus(current);
    } catch (err) {
      console.error('Failed to get web project status', err);
    }
  };

  const waitForServerReady = useCallback((port: number) => {
    const targetUrl = `http://localhost:${port}`;
    setWaitingForReady(true);
    setReadyMessage('Installing dependencies & starting dev server...');
    setUrl('');

    let attempts = 0;
    const maxAttempts = 120; // 6 minutes max (120 * 3s)

    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollRef.current) clearInterval(pollRef.current);
        setWaitingForReady(false);
        setReadyMessage('');
        toast.error('Server took too long to start. Try opening it externally.');
        setUrl(targetUrl);
        setKey(prev => prev + 1);
        return;
      }

      if (attempts < 5) {
        setReadyMessage('Installing dependencies & starting dev server...');
      } else if (attempts < 15) {
        setReadyMessage('Compiling... this may take a minute on first run...');
      } else {
        setReadyMessage(`Still waiting for server... (${attempts * 3}s elapsed)`);
      }

      try {
        // Use a fetch with a short timeout to probe the server
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const resp = await fetch(targetUrl, {
          mode: 'no-cors',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        // no-cors fetch returns opaque response (status 0), but if it doesn't throw, the server is up
        if (pollRef.current) clearInterval(pollRef.current);
        setWaitingForReady(false);
        setReadyMessage('');
        setUrl(targetUrl);
        setKey(prev => prev + 1);
        toast.success('Dev server is ready!');
      } catch {
        // Server not ready yet, keep polling
      }
    }, 3000);
  }, []);

  const handleStart = async () => {
    try {
      setLoading(true);
      const newStatus = await webProjectApi.startServer(projectId);
      setStatus(newStatus);
      toast.success('Web server container started! Waiting for it to be ready...');
      if (newStatus.port) {
        waitForServerReady(newStatus.port);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to start web server');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    try {
      setLoading(true);
      if (pollRef.current) clearInterval(pollRef.current);
      setWaitingForReady(false);
      setReadyMessage('');
      await webProjectApi.stopServer(projectId);
      setStatus({ status: 'STOPPED', port: null });
      setUrl('');
      toast.success('Web server stopped');
    } catch (err) {
      console.error(err);
      toast.error('Failed to stop web server');
    } finally {
      setLoading(false);
    }
  };

  const reloadIframe = () => {
    setKey(prev => prev + 1);
  };

  const openExternal = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090B]">
      {/* Header / Toolbar */}
      <div className="flex items-center justify-between p-2 border-b border-white/10 bg-[#0F0F12]">
        <div className="flex items-center gap-2">
          {status.status === 'STOPPED' ? (
            <button
              onClick={handleStart}
              disabled={loading}
              className="p-1.5 text-green-400 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
              title="Start Dev Server"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" fill="currentColor" />}
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={loading}
              className="p-1.5 text-red-400 hover:bg-white/10 rounded transition-colors disabled:opacity-50"
              title="Stop Dev Server"
            >
              {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" fill="currentColor" />}
            </button>
          )}
          
          <div className="h-4 w-[1px] bg-white/10 mx-1" />
          
          <button
            onClick={reloadIframe}
            disabled={status.status !== 'RUNNING' || waitingForReady}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30"
            title="Reload Preview"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* URL Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="bg-[#1A1A2E] border border-white/10 rounded flex items-center px-3 py-1">
            <span className="text-xs text-white/50 truncate">
              {url || (waitingForReady ? 'Starting...' : 'Server stopped')}
            </span>
          </div>
        </div>

        <button
          onClick={openExternal}
          disabled={!url}
          className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-30"
          title="Open in new tab"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative bg-white">
        {waitingForReady ? (
          /* Loading / Waiting for server readiness */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090B] text-white/60">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#1A1A2E] flex items-center justify-center mb-4">
                <Loader className="w-8 h-8 text-[#D4AF37] animate-spin" />
              </div>
              <p className="text-sm text-white/60">{readyMessage}</p>
              <div className="mt-3 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] rounded-full"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ width: '50%' }}
                />
              </div>
            </motion.div>
          </div>
        ) : status.status === 'RUNNING' && url ? (
          <iframe
            key={key}
            src={url}
            className="w-full h-full border-none"
            title="Browser Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          /* Stopped state */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#09090B] text-white/40">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#1A1A2E] flex items-center justify-center mb-4">
                <Play className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-sm">Dev server is stopped</p>
              <button
                onClick={handleStart}
                disabled={loading}
                className="mt-4 px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:shadow-lg hover:shadow-[#D4AF37]/20 text-black font-semibold rounded-lg text-sm transition-all"
              >
                {loading ? 'Starting...' : 'Start Web Project'}
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
