module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const toEmail = process.env.RESEND_TO_EMAIL;

  if (!apiKey || !fromEmail || !toEmail) {
    res.status(500).json({ ok: false, error: 'Resend 환경 변수가 설정되지 않았습니다.' });
    return;
  }

  const body = req.body || {};
  const subject = `[온돌컴퍼니] 새로운 상담 신청: ${body.name || '이름 없음'}`;
  const html = `
    <h2>새 상담 신청</h2>
    <p><strong>이름:</strong> ${body.name || '-'}</p>
    <p><strong>연락처:</strong> ${body.phone || '-'}</p>
    <p><strong>이메일:</strong> ${body.email || '-'}</p>
    <p><strong>현재 상황:</strong> ${body.situation || '-'}</p>
    <p><strong>원하는 결과:</strong> ${body.goal || '-'}</p>
    <p><strong>상태:</strong> ${body.status || 'pending'}</p>
  `;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html,
        text: `${subject}\n\n이름: ${body.name || '-'}\n연락처: ${body.phone || '-'}\n이메일: ${body.email || '-'}\n현재 상황: ${body.situation || '-'}\n원하는 결과: ${body.goal || '-'}`
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      res.status(502).json({ ok: false, error: data.message || 'Resend 이메일 발송에 실패했습니다.' });
      return;
    }

    res.status(200).json({ ok: true, message: '이메일 발송이 완료되었습니다.', id: data.id });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message || '이메일 발송 중 오류가 발생했습니다.' });
  }
};
