// Add this script to your online.uttoron.academy website
// This handles communication with the desktop app for cookie persistence
// Only works for Linux users

(function () {
    'use strict';

    // Check if running in desktop app
    //const isDesktopApp = window.location.search.includes('isDesktopApp=true');

    //if (!isDesktopApp) {
    //    return; // Only run in desktop app context
    //}

    // Check if running on Linux (detect platform)
    //const isLinux = navigator.userAgent.toLowerCase().includes('linux');

    if (!isLinux) {
        return; // Only run for Linux users
    }

    // Listen for messages from the desktop app
    window.addEventListener('message', function (event) {
        try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

            // Handle script injection
            if (data.MessageType === 'InjectCookieScript' && data.Script) {
                try {
                    eval(data.Script);
                } catch (err) {
                    console.error('[Website] Error executing script:', err);
                }
            }

            // Handle cookie restoration
            if (data.MessageType === 'RestoreSPAuthCookie' && data.Payload && data.Payload.cookie) {
                document.cookie = `.SP_AUTH=${data.Payload.cookie}; path=/; expires=${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()}; secure; SameSite=Lax`;
                // Reload to apply cookie
                setTimeout(() => window.location.reload(), 500);
            }
        } catch (error) {
            console.error('[Website] Error handling desktop app message:', error);
        }
    });

    // Function to send messages to desktop app (Linux compatible)
    function sendToDesktopApp(message) {
        if (isLinux) {
            if (window.external && typeof window.external.sendMessage === 'function') {
                window.external.sendMessage(JSON.stringify(message));
            } else {
                console.warn('[Website] Linux desktop app messaging not available');
            }
        } else {
            if (window.chrome && window.chrome.webview && window.chrome.webview.postMessage) {
                window.chrome.webview.postMessage(message);
            } else {
                console.warn('[Website] Windows desktop app messaging not available');
            }
        }
    }

    // Save cookie when it changes (for login) and detect logout
    let lastCookie = null;
    let lastSPAuthCookie = null;
    setInterval(function () {
        const cookies = document.cookie;
        if (cookies !== lastCookie) {
            lastCookie = cookies;
            // Check for .SP_AUTH cookie (exact name with dot)
            const spAuthMatch = cookies.match(/(?:^|;\s*)\.SP_AUTH=([^;]+)/);
            const currentSPAuthCookie = spAuthMatch ? spAuthMatch[1] : null;

            if (currentSPAuthCookie && currentSPAuthCookie !== lastSPAuthCookie) {
                // Cookie was added or changed
                sendToDesktopApp({
                    MessageType: 'SaveSPAuthCookie',
                    Payload: { cookie: currentSPAuthCookie }
                });
                lastSPAuthCookie = currentSPAuthCookie;
            } else if (!currentSPAuthCookie && lastSPAuthCookie) {
                // Cookie was removed - user logged out
                sendToDesktopApp({
                    MessageType: 'ClearSPAuthCookie',
                    Payload: {}
                });
                lastSPAuthCookie = null;
            }
        }
    }, 1000);

    // Request saved cookie on page load
    window.addEventListener('DOMContentLoaded', function () {
        // Initialize tracking state
        const initialCookieMatch = document.cookie.match(/(?:^|;\s*)\.SP_AUTH=([^;]+)/);
        lastSPAuthCookie = initialCookieMatch ? initialCookieMatch[1] : null;

        // Check if not logged in (no .SP_AUTH cookie)
        if (!initialCookieMatch) {
            sendToDesktopApp({
                MessageType: 'RequestSPAuthCookie'
            });
        }
    });
})();