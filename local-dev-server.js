const http = require('http');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const port = process.env.PORT || 8000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('잘못된 JSON 요청입니다.'));
      }
    });
    req.on('error', reject);
  });
}

async function handleSendEmail(req, res, body) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const toEmail = process.env.RESEND_TO_EMAIL;

  if (!apiKey || !fromEmail || !toEmail) {
    return sendJson(res, 500, {
      ok: false,
      error: 'Resend 환경 변수가 설정되지 않았습니다.'
    });
  }

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
      return sendJson(res, 502, {
        ok: false,
        error: data.message || 'Resend 이메일 발송에 실패했습니다.'
      });
    }

    return sendJson(res, 200, {
      ok: true,
      message: '이메일 발송이 완료되었습니다.',
      id: data.id
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error.message || '이메일 발송 중 오류가 발생했습니다.'
    });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/send-email') {
      const body = await readBody(req);
      return handleSendEmail(req, res, body);
    }

    let pathname = req.url === '/' ? '/index.html' : req.url;
    pathname = pathname.split('?')[0];
    const filePath = path.join(rootDir, pathname);

    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403); res.end('Forbidden'); return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || '서버 오류' });
  }
});

server.listen(port, () => {
  console.log(`Server listening on http://127.0.0.1:${port}`);
});
