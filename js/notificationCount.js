// Module-level cached counts so the bell badge can show the combined total
// of QnA + Notice (internal, Redis-backed) and Community (external API).
var _qnaGeneralTotal = 0;
var _communityTotal = 0;

// Cap the displayed count at "99+" (the underlying numeric value is kept as-is).
function formatBadgeCount(n) {
    n = parseInt(n, 10) || 0;
    return n > 99 ? "99+" : n;
}

function renderBellBadge() {
    var total = (parseInt(_qnaGeneralTotal, 10) || 0) + (parseInt(_communityTotal, 10) || 0);
    if (total > 0) {
        $("#notification_badge").removeClass("d-none").html(formatBadgeCount(total));
    } else {
        $("#notification_badge").addClass("d-none").html("");
    }
}

function GetNotificationCount() {
    // QnA + Notice (cookie-first)
    var cached = getCookie("QnANotificationCount");
    var cachedNum = parseInt(cached, 10);
    if (cached != null && !isNaN(cachedNum)) {
        _qnaGeneralTotal = cachedNum;
        renderBellBadge();
    } else {
        FetchNotificationCount();
    }

    // Drop any community cache left by a different user on this browser before reading it.
    ensureCommunityCacheForCurrentUser();

    // Community (cookie-first)
    var cachedCommunity = getCookie("CommunityNotificationCount");
    var cachedCommunityNum = parseInt(cachedCommunity, 10);
    if (cachedCommunity != null && !isNaN(cachedCommunityNum)) {
        _communityTotal = cachedCommunityNum;
        if (_communityTotal > 0) {
            $("#notif_community_count").removeClass("d-none").html(formatBadgeCount(_communityTotal));
        } else {
            $("#notif_community_count").addClass("d-none");
        }
        renderBellBadge();
    } else {
        FetchCommunityNotificationCount();
    }
}

function FetchNotificationCount() {
    $.ajax({
        url: "/Notification/DisplayNotificationCount",
        type: "POST",
        success: function (data) {
            if (data.hasOwnProperty("AutoLogout")) {
                if (data.AutoLogout == true) {
                    window.location.href = "/Account/Logout";
                }
            }
            else if (data.hasOwnProperty("isSuccess")) {
                if (data.isSuccess) {
                    var total = data.notificationCount || 0;
                    var qnaCount = data.qnaCount || 0;
                    var generalCount = data.generalCount || 0;

                    _qnaGeneralTotal = total;
                    renderBellBadge();

                    if (qnaCount > 0) {
                        $("#notif_qna_count").removeClass("d-none").html(formatBadgeCount(qnaCount));
                    } else {
                        $("#notif_qna_count").addClass("d-none");
                    }

                    if (generalCount > 0) {
                        $("#notif_general_count").removeClass("d-none").html(formatBadgeCount(generalCount));
                    } else {
                        $("#notif_general_count").addClass("d-none");
                    }

                    // Cache positive count for 5 min (stable). Cache zero for 1 min so new notifications surface quickly without hammering the server on every page load.
                    if (total > 0) {
                        setCookieInMinute("QnANotificationCount", total, 5);
                    } else {
                        setCookieInMinute("QnANotificationCount", 0, 1);
                    }
                }
            }
        },
        error: function (data) { }
    });
}

// Purge community caches that belong to a different user (shared browser / re-login),
// so user B never sees (or queries with) user A's cached community token/count.
function ensureCommunityCacheForCurrentUser() {
    var current = window.opCommunityUser;
    if (!current) return; // current user unknown — leave caches untouched
    try {
        var raw = localStorage.getItem("CommunityNotifConfig");
        if (!raw) return;
        var c = JSON.parse(raw);
        if (c && c.userName && c.userName !== current) {
            localStorage.removeItem("CommunityNotifConfig");
            setCookieInMinute("CommunityNotificationCount", "", 0);
            _communityTotal = 0;
            $("#notif_community_count").addClass("d-none");
        }
    } catch (e) { }
}

// Reads the cached community token/config (valid ~12h) so we don't hit our server on every load.
function getCommunityNotifConfig() {
    try {
        var raw = localStorage.getItem("CommunityNotifConfig");
        if (!raw) return null;
        var c = JSON.parse(raw);
        if (!c || !c.accessToken || !c.accessKey || !c.unreadCountsUrl || !c.userName || !c.exp || Date.now() > c.exp) {
            return null;
        }
        // Shared browser / re-login: never use a token cached for a different user.
        if (window.opCommunityUser && c.userName !== window.opCommunityUser) {
            return null;
        }
        return c;
    } catch (e) {
        return null;
    }
}

function saveCommunityNotifConfig(data) {
    try {
        var ttlMin = Math.min(parseInt(data.expiresInMins, 10) || 1440, 720); // cap at 12h
        var cfg = {
            accessToken: data.accessToken,
            accessKey: data.accessKey,
            unreadCountsUrl: data.unreadCountsUrl,
            userName: data.userName,
            exp: Date.now() + ttlMin * 60000
        };
        localStorage.setItem("CommunityNotifConfig", JSON.stringify(cfg));
        return cfg;
    } catch (e) {
        return null;
    }
}

function FetchCommunityNotificationCount() {
    var cfg = getCommunityNotifConfig();
    if (cfg) {
        CallCommunityUnreadCounts(cfg);
        return;
    }

    // No valid token cached — get one from our server (cheap, ~once per token lifetime).
    $.ajax({
        url: "/Community/CommunityNotificationConfig",
        type: "GET",
        success: function (data) {
            if (data && data.isSuccess && data.accessToken) {
                var saved = saveCommunityNotifConfig(data);
                if (saved) CallCommunityUnreadCounts(saved);
            }
        },
        error: function (data) { }
    });
}

// Direct call to the community API from the browser using the cached member UI token.
// Uses the client-facing chat endpoint (member derived from the token), authenticated
// with the raw UI token + access key — same scheme the embedded chat widget uses.
function CallCommunityUnreadCounts(cfg) {
    var url = cfg.unreadCountsUrl;

    $.ajax({
        url: url,
        type: "GET",
        headers: { "authorization": cfg.accessToken, "accesskey": cfg.accessKey },
        success: function (data) {
            var communityCount = 0;
            if (data && data.isSuccess && data.data) {
                communityCount = parseInt(data.data.totalUnreadCount, 10) || 0;
            }

            _communityTotal = communityCount;
            renderBellBadge();

            if (communityCount > 0) {
                $("#notif_community_count").removeClass("d-none").html(formatBadgeCount(communityCount));
            } else {
                $("#notif_community_count").addClass("d-none");
            }

            // External API — cache positive for 5 min, zero for 1 min.
            if (communityCount > 0) {
                setCookieInMinute("CommunityNotificationCount", communityCount, 5);
            } else {
                setCookieInMinute("CommunityNotificationCount", 0, 1);
            }
        },
        error: function (xhr) {
            // 401 → token likely expired; drop the cache so the next tick re-fetches a fresh one.
            if (xhr && xhr.status === 401) {
                try { localStorage.removeItem("CommunityNotifConfig"); } catch (e) { }
            }
        }
    });
}

function GetNotificationCountForSingleQnA() {
    FetchNotificationCount();
}

function InvalidateNotificationCountCache() {
    setCookieInMinute("QnANotificationCount", "", 0);
    FetchNotificationCount();
}

// Dropdown toggle
$(document).on("click", "#notification_bell_toggle", function (e) {
    e.preventDefault();
    e.stopPropagation();
    var dropdown = $("#notification_dropdown");
    if (dropdown.hasClass("d-none")) {
        dropdown.removeClass("d-none");
        FetchNotificationCount();
        FetchCommunityNotificationCount();
    } else {
        dropdown.addClass("d-none");
    }
});

// Community notification click
$(document).on("click", "#notif_community_link", function (e) {
    e.preventDefault();
    $("#notification_dropdown").addClass("d-none");

    var path = window.location.pathname.toLowerCase();
    if (path === "/community/messages" || path === "/community/messages/") {
        if (window.CommunityOpenNotifications) {
            window.CommunityOpenNotifications();
            return;
        }
    }

    localStorage.setItem(
        "CommunityRedirectUrlParams",
        JSON.stringify({ openNotifications: true })
    );
    window.location.href = "/Community/Messages";
});

// Close dropdown when clicking outside
$(document).on("click", function (e) {
    if (!$(e.target).closest(".notification").length) {
        $("#notification_dropdown").addClass("d-none");
    }
});

$(document).ready(function () {
    GetNotificationCount();
});
