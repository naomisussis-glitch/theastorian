// Turns the site into an installable app: registers the service worker (sw.js),
// which lets pages a reader has already opened work without a connection.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  });
}
