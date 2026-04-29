import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Excalidraw, exportToBlob } from '@excalidraw/excalidraw';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcalidrawImperativeAPI = any;

export interface WhiteboardHandle {
  getSceneJson: () => string;
  getImageBase64: () => Promise<string | null>;
  clearCanvas: () => void;
  restoreScene: (sceneJson: string) => void;
}

interface Props {
  onSceneChange?: (elementCount: number) => void;
}

const Whiteboard = forwardRef<WhiteboardHandle, Props>(({ onSceneChange }, ref) => {
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);

  useImperativeHandle(ref, () => ({
    getSceneJson: () => {
      const api = excalidrawAPIRef.current;
      if (!api) return '{}';
      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();
      return JSON.stringify({
        elements,
        appState: { viewBackgroundColor: appState.viewBackgroundColor },
        files,
      });
    },

    getImageBase64: async () => {
      const api = excalidrawAPIRef.current;
      if (!api) return null;
      try {
        const elements = api.getSceneElements();
        if (!elements.length) return null;
        const blob = await exportToBlob({
          elements,
          mimeType: 'image/png',
          appState: {
            ...api.getAppState(),
            exportWithDarkMode: true,
          },
          files: api.getFiles(),
        });
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]); 
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error('Export error:', err);
        return null;
      }
    },

    clearCanvas: () => {
      excalidrawAPIRef.current?.updateScene({ elements: [] });
    },

    restoreScene: (sceneJson: string) => {
      const api = excalidrawAPIRef.current;
      if (!api) return;
      try {
        const parsed = JSON.parse(sceneJson);
        api.updateScene({
          elements: parsed.elements || [],
          appState: parsed.appState,
          files: parsed.files ?? {},
        });
      } catch { /* ignore malformed JSON */ }
    },
  }));

  const handleChange = useCallback(
    (elements: readonly { id: string }[]) => {
      onSceneChange?.(elements.length);
    },
    [onSceneChange]
  );

  return (
    <div className="w-full h-full min-h-0 overflow-hidden relative">
      <Excalidraw
        excalidrawAPI={(api) => { excalidrawAPIRef.current = api; }}
        theme="dark"
        onChange={handleChange}
        initialData={{
          appState: {
            viewBackgroundColor: "#1a2035",
            currentItemStrokeColor: "#ffffff",
            showWelcomeScreen: false,
            openSidebar: null,
          },
        }}
        UIOptions={{
          canvasActions: {
            saveToActiveFile: false,
            loadScene: true,
            export: { saveFileToDisk: true },
            toggleTheme: false,
          },
        }}
      />
    </div>
  );
});

Whiteboard.displayName = 'Whiteboard';
export default Whiteboard;
