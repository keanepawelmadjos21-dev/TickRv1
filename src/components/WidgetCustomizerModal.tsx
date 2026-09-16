import React from 'react';
import { X, Eye, EyeOff, ArrowUp, ArrowDown, LayoutGrid, RotateCcw, Columns2, Square } from 'lucide-react';
import { WidgetConfig, WidgetId } from '../types';
import { DEFAULT_WIDGETS } from '../services/storageService';

interface WidgetCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgets: WidgetConfig[];
  onSaveWidgets: (widgets: WidgetConfig[]) => void;
}

export const WidgetCustomizerModal: React.FC<WidgetCustomizerModalProps> = ({
  isOpen,
  onClose,
  widgets,
  onSaveWidgets
}) => {
  if (!isOpen) return null;

  const handleToggleWidget = (id: WidgetId) => {
    const updated = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    onSaveWidgets(updated);
  };

  const handleToggleWidth = (id: WidgetId) => {
    const updated = widgets.map(w => {
      if (w.id === id) {
        return { ...w, width: (w.width === 'full' ? 'half' : 'full') as 'half' | 'full' };
      }
      return w;
    });
    onSaveWidgets(updated);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= widgets.length) return;

    const copy = [...widgets];
    const temp = copy[index];
    copy[index] = copy[newIndex];
    copy[newIndex] = temp;

    // update order property
    const reordered = copy.map((w, idx) => ({ ...w, order: idx }));
    onSaveWidgets(reordered);
  };

  const handleResetDefault = () => {
    onSaveWidgets(DEFAULT_WIDGETS);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Customize Dashboard Widgets
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toggle visibility, reorder items, and choose widget widths
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body list of widgets */}
        <div className="p-5 overflow-y-auto space-y-2.5">
          <div className="flex justify-between items-center pb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Dashboard Layout ({widgets.filter(w => w.enabled).length} of {widgets.length} Active)
            </span>
            <button
              onClick={handleResetDefault}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Layout
            </button>
          </div>

          {widgets.map((widget, index) => (
            <div
              key={widget.id}
              className={`flex items-center justify-between p-3 rounded-xl border transition ${
                widget.enabled
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <button
                  onClick={() => handleToggleWidget(widget.id)}
                  className={`p-1.5 rounded-lg border transition ${
                    widget.enabled
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                  title={widget.enabled ? 'Hide widget' : 'Show widget'}
                >
                  {widget.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <div className="min-w-0">
                  <span className="text-sm font-medium text-slate-900 dark:text-white block truncate">
                    {widget.title}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Width: {widget.width === 'full' ? 'Full Grid Width' : 'Half Width (1 Col)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Toggle width */}
                <button
                  onClick={() => handleToggleWidth(widget.id)}
                  disabled={!widget.enabled}
                  className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition disabled:opacity-40"
                  title="Toggle between Half and Full width"
                >
                  {widget.width === 'full' ? 'Full' : 'Half'}
                </button>

                {/* Move Up */}
                <button
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                  title="Move Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                {/* Move Down */}
                <button
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === widgets.length - 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                  title="Move Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
