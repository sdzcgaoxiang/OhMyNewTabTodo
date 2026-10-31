import React, { useEffect, useId, useRef, useState } from 'react';
import { errorMessage } from './ui.ts';
import { useLanguage, useT } from '../i18n.tsx';

interface DialogProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  drawer?: boolean;
  closeLabel?: string;
}
export function Dialog({ title, onClose, children, drawer = false, closeLabel }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  const t = useT();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={drawer ? 'dialog drawer' : 'dialog'}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <header className="dialog-header">
        <h2 id={id}>{title}</h2>
        <button className="icon-button" aria-label={closeLabel || t('关闭窗口')} onClick={onClose}>
          ×
        </button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export interface ConfirmProps {
  title: string;
  text: string;
  action?: string;
  onConfirm: () => Promise<unknown> | void;
  onClose: () => void;
}
export function Confirm({ title, text, action, onConfirm, onClose }: ConfirmProps) {
  const [error, setError] = useState<unknown>(null),
    [busy, setBusy] = useState(false);
  const t = useT();
  const language = useLanguage();
  return (
    <Dialog title={title} onClose={onClose}>
      <p>{text}</p>
      {error != null && (
        <p className="error" role="alert">
          {errorMessage(error, language)}
        </p>
      )}
      <footer className="form-actions">
        <button onClick={onClose}>{t('取消')}</button>
        <button
          className="danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(e);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? t('处理中…') : action || t('确认删除')}
        </button>
      </footer>
    </Dialog>
  );
}
