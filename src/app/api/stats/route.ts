import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function GET() {
  const defaultStats = {
    today: { files: 0, size: 0 },
    total: { files: 0, size: 0 } // MB
  };

  try {
    const context = getRequestContext();
    const KV = (context?.env as any)?.STATS_STORE;

    if (!KV) {
      return NextResponse.json(defaultStats);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    
    const [todayFiles, todayBytes, totalFiles, totalBytes] = await Promise.all([
      (KV as any).get(`today_files_${todayStr}`),
      (KV as any).get(`today_bytes_${todayStr}`),
      (KV as any).get('total_files'),
      (KV as any).get('total_bytes')
    ]);

    return NextResponse.json({
      today: {
        files: parseInt(todayFiles || '0', 10),
        size: parseFloat(todayBytes || '0') / (1024 * 1024)
      },
      total: {
        files: parseInt(totalFiles || '0', 10),
        size: parseFloat(totalBytes || '0') / (1024 * 1024)
      }
    });
  } catch (error) {
    console.error('Stats API GET Error, returning defaults:', error);
    return NextResponse.json(defaultStats);
  }
}

/**
 * 統計情報の更新 (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const context = getRequestContext();
    const KV = (context?.env as any)?.STATS_STORE;
    const { files, bytes } = await request.json();

    if (!KV) {
      return NextResponse.json({ success: true, mock: true });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // KV はアトミックなインクリメントをサポートしていないため、
    // 厳密な精度が必要な場合は D1 などのデータベースが推奨されますが、
    // おおまかな統計値としてはこれで十分機能します。
    
    const [currTodayFiles, currTodayBytes, currTotalFiles, currTotalBytes] = await Promise.all([
      (KV as any).get(`today_files_${todayStr}`),
      (KV as any).get(`today_bytes_${todayStr}`),
      (KV as any).get('total_files'),
      (KV as any).get('total_bytes')
    ]);

    await Promise.all([
      (KV as any).put(`today_files_${todayStr}`, (parseInt(currTodayFiles || '0', 10) + files).toString()),
      (KV as any).put(`today_bytes_${todayStr}`, (parseFloat(currTodayBytes || '0') + bytes).toString()),
      (KV as any).put('total_files', (parseInt(currTotalFiles || '0', 10) + files).toString()),
      (KV as any).put('total_bytes', (parseFloat(currTotalBytes || '0') + bytes).toString())
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stats API POST Error:', error);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}
