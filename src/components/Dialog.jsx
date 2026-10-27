import React, { useEffect, useId, useRef, useState } from 'react';
export function Dialog({ title, onClose, children, drawer = false, closeLabel = '关闭窗口' }) {
  const ref = useRef(null),
    id = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
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
        <button className="icon-button" aria-label={closeLabel} onClick={onClose}>
          ×
        </button>
      </header>
      <div className="dialog-body">{children}</div>
    </dialog>
  );
}
export function Confirm({ title, text, action = '确认删除', onConfirm, onClose }) {
  const [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <Dialog title={title} onClose={onClose}>
      <p>{text}</p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <footer className="form-actions">
        <button onClick={onClose}>取消</button>
        <button
          className="danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? '处理中…' : action}
        </button>
      </footer>
    </Dialog>
  );
}
