import { generateAITimetable } from '../../src/server/timetableAILogic.ts';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const body = req.body || {};
    const result = await generateAITimetable(body);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Vercel API error in /api/ai/generate-timetable:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while generating timetable'
    });
  }
}
