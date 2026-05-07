import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// 3DS ACS callback endpoint.
//
// Mirrors VincentVanGogh's `payment.3ds.callback` Laravel route. After the
// issuer's ACS finishes either the 3DS method URL fingerprinting or the
// challenge URL prompt, it POSTs the response body to this URL inside the
// merchant's iframe. We have to read that body server-side because BabyBets'
// public site is a Vite SPA, so without this endpoint Vercel just serves the
// React HTML and the form data is dropped before any JavaScript can read it.
//
// We render an HTML page that embeds the parsed body as a JSON literal and
// postMessages it to the parent checkout window. The parent's
// handle3DSChallenge listener picks it up and calls continue-3ds with the
// fields Cardstream needs (threeDSMethodData / cres / MD).
//
// Deploy with --no-verify-jwt because the ACS posts here without a session.
serve(async (req) => {
  const url = new URL(req.url)
  const orderRef = url.searchParams.get('orderRef') || ''
  const acsResponse = url.searchParams.get('threeDSAcsResponse') || ''

  const threeDSResponse: Record<string, string> = {}

  if (req.method === 'POST') {
    // ACS sends application/x-www-form-urlencoded — parse from text to be
    // robust to runtimes that don't expose req.formData() reliably.
    try {
      const contentType = req.headers.get('content-type') || ''
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await req.text()
        new URLSearchParams(text).forEach((value, key) => {
          threeDSResponse[key] = value
        })
      } else if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData()
        formData.forEach((value, key) => {
          threeDSResponse[key] = String(value)
        })
      } else {
        // Fallback: try text + URLSearchParams anyway
        const text = await req.text()
        if (text) {
          new URLSearchParams(text).forEach((value, key) => {
            threeDSResponse[key] = value
          })
        }
      }
    } catch (e) {
      console.error('[3ds-callback] Failed to parse POST body', e)
    }
  } else {
    // GET — challenge URL redirects sometimes come back via GET. Pull from
    // the query string, skipping our own metadata params.
    url.searchParams.forEach((value, key) => {
      if (key === 'orderRef' || key === 'threeDSAcsResponse') return
      threeDSResponse[key] = value
    })
  }

  console.log('[3ds-callback] Received ACS response', {
    method: req.method,
    orderRef,
    acsResponse,
    keys: Object.keys(threeDSResponse),
  })

  // Embed the response as a JSON literal in the page so the inline script
  // can postMessage it to the parent. JSON.stringify already escapes the
  // characters that would break out of a <script> block, but harden against
  // </script> appearing inside any value just in case.
  const responseLiteral = JSON.stringify(threeDSResponse).replace(/<\/script/gi, '<\\/script')
  const orderRefLiteral = JSON.stringify(orderRef)

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Completing authentication</title>
<style>
  html, body { height: 100%; margin: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex; align-items: center; justify-content: center;
    background: #f3f4f6;
  }
  .wrap { text-align: center; padding: 2rem; }
  .spinner {
    width: 40px; height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #496B71;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  p { color: #6b7280; margin: 0; }
</style>
</head>
<body>
<div class="wrap">
  <div class="spinner"></div>
  <p>Completing authentication&hellip;</p>
</div>
<script>
(function () {
  var data = ${responseLiteral};
  var orderRef = ${orderRefLiteral};
  var payload = { type: 'threeDSResponse', response: data, orderRef: orderRef };
  if (window.parent && window.parent !== window) {
    window.parent.postMessage(payload, '*');
  } else if (window.opener) {
    window.opener.postMessage(payload, '*');
  }
})();
</script>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Prevent caching so an in-progress 3DS flow always sees the latest body
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
})
