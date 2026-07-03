'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

const STATUS_OPTIONS = [
  { value: 'full_work', label: '出勤' },
  { value: 'half_work', label: '半日出勤' },
  { value: 'day_off', label: '休日' },
];

const STATUS_LABEL = {
  full_work: '出勤',
  half_work: '半日出勤',
  day_off: '休日',
  needs_confirmation: '要確認',
};

const STATUS_CLASS = {
  full_work: 'status-full',
  half_work: 'status-half',
  day_off: 'status-off',
  needs_confirmation: 'status-conflict',
};

// cells: [{ iso, dayNumber, inPeriod, status, manualFixed }, ...]
export default function CalendarGrid({ cells }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const selectedCell = cells.find((c) => c.iso === selected);

  function openCell(iso) {
    setSelected(iso);
    setErrorMsg('');
  }

  async function saveStatus(status) {
    if (!selected) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selected, status }),
      });
      if (!res.ok) {
        throw new Error('保存に失敗しました。もう一度お試しください。');
      }
      setSelected(null);
      router.refresh();
    } catch (e) {
      setErrorMsg(e.message || '保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  }

  async function clearDay() {
    if (!selected) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selected }),
      });
      if (!res.ok) {
        throw new Error('削除に失敗しました。もう一度お試しください。');
      }
      setSelected(null);
      router.refresh();
    } catch (e) {
      setErrorMsg(e.message || '削除に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="weekday-header">
            {w}
          </div>
        ))}
        {cells.map((c) => (
          <button
            key={c.iso}
            type="button"
            className={[
              'day-cell',
              c.inPeriod ? '' : 'outside',
              c.status ? STATUS_CLASS[c.status] : '',
            ].join(' ')}
            onClick={() => openCell(c.iso)}
          >
            <div className="day-number">{c.dayNumber}</div>
            {c.status && <div className="day-status">{STATUS_LABEL[c.status]}</div>}
            {c.manualFixed && <div className="manual-badge">手動</div>}
          </button>
        ))}
      </div>

      {selectedCell && (
        <div className="modal-backdrop" onClick={() => !saving && setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <p className="modal-title">{selected} の予定を選択</p>
            {errorMsg && <p className="error modal-error">{errorMsg}</p>}
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className="modal-option"
                disabled={saving}
                onClick={() => saveStatus(opt.value)}
              >
                {opt.label}
              </button>
            ))}
            <button className="modal-option modal-clear" disabled={saving} onClick={clearDay}>
              未設定に戻す
            </button>
            <button className="modal-cancel" disabled={saving} onClick={() => setSelected(null)}>
              キャンセル
            </button>
          </div>
        </div>
      )}
    </>
  );
}
