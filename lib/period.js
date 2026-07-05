// 「管理期間」＝毎月16日〜翌月15日の単位を扱うための計算ロジック

function pad(n) {
  return String(n).padStart(2, '0');
}

export function formatDateISO(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 基準日が属する「16日〜翌月15日」の期間を返す
export function getPeriodRange(refDate) {
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const day = refDate.getDate();

  let startY = y;
  let startM = m;
  if (day < 16) {
    startM = m - 1;
    if (startM < 0) {
      startM = 11;
      startY = y - 1;
    }
  }

  const start = new Date(startY, startM, 16);
  const end = new Date(startY, startM + 1, 15);
  const label = `${start.getFullYear()}年${start.getMonth() + 1}月16日 〜 ${end.getFullYear()}年${end.getMonth() + 1}月15日`;

  return { start, end, label };
}

// 基準日から2週間（14日間）の範囲を返す（トップページの日々確認用）
export function getTwoWeekRange(refDate) {
  const start = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 13);
  return { start, end };
}

// start〜endの日付を、月曜始まりの7列グリッドに収まるよう
// 前後を null（空欄）で埋めた配列にする（14日間表示など、週単位に揃っていない範囲向け）
export function getPaddedGridDates(start, end) {
  const startOffset = (start.getDay() + 6) % 7; // 0=月曜
  const cells = [];
  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }
  const cur = new Date(start);
  while (cur <= end) {
    cells.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < trailing; i++) {
    cells.push(null);
  }
  return cells;
}

// カレンダー表示用に、期間を含む「月曜始まり」の週単位のマス目を作る
// （期間の最初と最後が中途半端な週でも、その週をまるごと表示するため）
export function getCalendarWeeks(start, end) {
  const gridStart = new Date(start);
  const startOffset = (start.getDay() + 6) % 7; // 0=月曜
  gridStart.setDate(start.getDate() - startOffset);

  const gridEnd = new Date(end);
  const endOffset = (end.getDay() + 6) % 7;
  gridEnd.setDate(end.getDate() + (6 - endOffset));

  const weeks = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
