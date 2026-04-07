/**
 * 変換実績を統計サーバーに報告する
 * @param files 変換したファイル数
 * @param bytes 変換後の合計バイト数
 */
export async function reportConversionScale(files: number, bytes: number) {
  try {
    const response = await fetch('/api/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files, bytes }),
    });

    if (!response.ok) {
      console.warn('Failed to report stats:', response.statusText);
    }
  } catch (error) {
    console.error('Error reporting stats:', error);
  }
}
