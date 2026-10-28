// connect.ntnd.ai: hands a platform's sign-in back to Publish on her Mac (Security C1-C5, 28 Oct 2026).
// It sends nothing anywhere: no fetch, no beacon, no storage. Only her click on the button carries the code.
(() => {
  // C1: the platform comes from the path, and only from this list
  const PLATFORMS = { linkedin: "LinkedIn", instagram: "Instagram", facebook: "Facebook", threads: "Threads", pinterest: "Pinterest", tiktok: "TikTok" };
  // C2: bounded, plain characters only
  const SAFE = /^[A-Za-z0-9._~\-]{1,1024}$/;
  const line = document.getElementById("line");
  const sub = document.getElementById("sub");
  const back = document.getElementById("back");
  const m = /^\/([a-z]{1,20})\/?$/.exec(location.pathname);
  const platform = m && Object.prototype.hasOwnProperty.call(PLATFORMS, m[1]) ? m[1] : null;
  const q = new URLSearchParams(location.search);
  const code = q.get("code") || "";
  const state = q.get("state") || "";
  if (!platform) {
    line.textContent = "This link isn't one ntnd.growth uses.";
    return;
  }
  if (q.has("error")) {
    // C2: the platform's error words are never shown
    line.textContent = `${PLATFORMS[platform]} didn't connect.`;
    sub.textContent = "Go back to ntnd.growth and start again from Channels.";
    return;
  }
  if (!SAFE.test(code) || !SAFE.test(state)) {
    line.textContent = "This sign-in link is incomplete.";
    sub.textContent = "Go back to ntnd.growth and start again from Channels.";
    return;
  }
  line.textContent = `${PLATFORMS[platform]} said yes.`;
  sub.textContent = "Press the button to finish connecting in ntnd.growth on this Mac.";
  // C2: a fixed target; the values only through encodeURIComponent
  back.href = `http://127.0.0.1:4897/connect/${platform}?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
  back.hidden = false;
})();
