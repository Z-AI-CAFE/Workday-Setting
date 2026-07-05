'use client';

// Vercel側のキャッシュにより表示が古いままになることがあるため、
// 毎回必ず新しいURLとして扱わせることで確実に最新状態を取得しなおすボタン
export default function RefreshButton() {
  function handleClick() {
    const url = new URL(window.location.href);
    url.searchParams.set('_r', Date.now().toString());
    window.location.href = url.toString();
  }

  return (
    <button type="button" className="refresh-button" onClick={handleClick}>
      変更を反映する
    </button>
  );
}
