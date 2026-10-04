async function poll() {
  for (let i = 0; i < 24; i++) {
    try {
      const res = await fetch('https://sree-mk-food-court.npavansooth.workers.dev/?t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const html = await res.text();
      const match = html.match(/index-[a-zA-Z0-9_-]+\.js/);
      const script = match ? match[0] : 'unknown';
      console.log(`[Attempt ${i + 1}] Script on live worker: ${script}`);
      if (script !== 'index-1De6cULs.js') {
        console.log('✨ NEW DEPLOYMENT DETECTED!', script);
        return true;
      }
    } catch (e) {
      console.error('Fetch error:', e.message);
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
  return false;
}

poll().then((deployed) => {
  if (!deployed) console.log('Deployment still pending or not finished within timeout.');
});
