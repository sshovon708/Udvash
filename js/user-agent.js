
    const userAgentGlobal = navigator.userAgent || navigator.vendor || window.opera;
    const isiOS = /iPhone|iPad|iPod/i.test(userAgentGlobal) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(userAgentGlobal);
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.platform) && !isiOS;
    const isLinux = /Linux/.test(navigator.platform) && !isiOS && !isAndroid && !isMacOS;
    const isDesktop = !isiOS && !isAndroid && !isMacOS && !isLinux;
    var appApiKeyGlobal = getCookie("appApiKey");
    var studentNameGlobal = getCookie("studentName");
    var userTypeGlobal = 'student';
    var appVersionGlobal = "";
    var returnUrlGlobal = getCookie("AppExamReturnUrl");

    function extractVersion(str) {
        const match = str.match(/\d+(\.\d+)+/);
        return match ? match[0] : null;
    }

    function compareVersions(v1, v2) {
        const parts1 = extractVersion(v1).split('.').map(Number);
        const parts2 = extractVersion(v2).split('.').map(Number);

        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const num1 = parts1[i] || 0;
            const num2 = parts2[i] || 0;
            if (num1 < num2) return -1;
            if (num1 > num2) return 1;
        }
        return 0;
    }

    function isVersionGreater(v1, v2) {
        return compareVersions(v1, v2) === 1;
    }

    function isVersionLower(v1, v2) {
        return compareVersions(v1, v2) === -1;
    }

    function isVersionEqual(v1, v2) {
        return compareVersions(v1, v2) === 0;
    }

    function getUserData() {
        return new Promise((resolve, reject) => {
            if (isAndroid) {
                try {
                    const userDataJson = Android.GetUserData();
                    const userData = JSON.parse(userDataJson);
                    resolve(userData);
                } catch (error) {
                    reject("Android GetUserData failed: " + error);
                }
            } else if (isiOS) {
                try {
                    window.receiveGetUserData = function (escapedJsonString) {
                        try {
                            const userData = JSON.parse(escapedJsonString);
                            resolve(userData);
                        } catch (err) {
                            reject("JSON parse error: " + err);
                        }
                    };
                    window.webkit.messageHandlers.GetUserData.postMessage(null);
                } catch (error) {
                    reject("iOS GetUserData call failed: " + error);
                }
            } else {
                reject("Unsupported platform");
            }
        });
    }

    function setUserData(apiKey, regNo, studentName, userType) {
        return new Promise((resolve, reject) => {
            try {
                if (isAndroid) {
                    if ((dataSiteName == 'udvash-unmesh' && isVersionLower(appVersionGlobal, "1.0.8")) || (dataSiteName == 'uttoron' && isVersionLower(appVersionGlobal, "1.0.3"))) {
                        Android.SetUserData(apiKey, regNo, studentName);
                    } else {
                        Android.SetUserData(apiKey, regNo, studentName, userType);
                    }
                    resolve();
                } else if (isiOS) {
                    window.webkit.messageHandlers.SetUserData.postMessage({
                        apiKey: apiKey,
                        regNo: regNo,
                        studentName: studentName,
                        userType: userType
                    });
                    resolve();
                } else {
                    reject("Unsupported platform");
                }
            } catch (error) {
                reject("SetUserData failed: " + error);
            }
        });
    }

    function runOmrFlow() {
        getUserData()
            .then(userData => {
                if (!userData.apiKey || userData.apiKey.trim() === "" || appApiKeyGlobal !== userData.apiKey) {
                    return setUserData(appApiKeyGlobal, appRegistrationNoGlobal, studentNameGlobal, userTypeGlobal);
                }
            })
            .then(() => {
                if (isAndroid) {
                    Android.OmrScan();
                } else if (isiOS) {
                    window.webkit.messageHandlers.OmrScan.postMessage(null);
                }
            })
            .catch(error => {
                console.error("OMR flow failed:", error);
            });
    }

    function runOmrFlowForOnlineOmr() {
        getUserData()
            .then(userData => {
                if (!userData.apiKey || userData.apiKey.trim() === "" || appApiKeyGlobal !== userData.apiKey) {
                    return setUserData(appApiKeyGlobal, appRegistrationNoGlobal, studentNameGlobal, userTypeGlobal);
                }
            })
            .then(() => {
                if (isAndroid) {
                    Android.OmrScanOnline(returnUrlGlobal);
                } else if (isiOS) {
                    window.webkit.messageHandlers.OmrScanOnline.postMessage({
                        returnUrl: returnUrlGlobal
                    });
                }
            })
            .catch(error => {
                console.error("OMR flow failed:", error);
            });
    }


    $(document).ready(function () {
        $('.uuu-left-sidebar ul li').each(function () {
            if (($('#topHeader').attr('data-app-id') == '' && $(this).find('a').attr('href') == '#app') || (isDesktop && $(this).find('a').attr('href') == '#app') || (isMacOS && $(this).find('a').attr('href') == '#app')) {
                $(this).remove();
            }
            else if ($('#topHeader').attr('data-app-id') == '' && $(this).find('a').attr('href') == '#appvideo') {
                $(this).remove();
            }
        });

        if (isMacOS || isLinux) {
            $(document).on('click', 'a[target="_blank"]', function (e) {
                e.preventDefault();

                const url = $(this).attr('href');

                if (url && window.external && typeof window.external.sendMessage === 'function') {
                    window.external.sendMessage(JSON.stringify({
                        MessageType: "OpenNewWindowWithDownload",
                        Payload: { url: url }
                    }));
                }
            });
        }
    });

    $(document).on('click', '.uuu-left-sidebar a, footer .btn-offline-download, .uuu-dashboard-menu .card-body a', function () {
        if ($(this).attr('href') == '#app') {
            if ((dataSiteName == 'udvash-unmesh' && isVersionLower(appVersionGlobal, "1.0.8")) || (dataSiteName == 'uttoron' && isVersionLower(appVersionGlobal, "1.0.3"))) {
                if (isAndroid) {
                    Android.OmrScan();
                } else if (isiOS) {
                    window.webkit.messageHandlers.OmrScan.postMessage(null);
                }
            }
            else {
                runOmrFlow();
            }
        }
        else if ($(this).attr('href') == '#appvideo') {
            if(isAndroid || isiOS){
                if ((dataSiteName == 'udvash-unmesh' && isVersionLower(appVersionGlobal, "1.0.8")) || (dataSiteName == 'uttoron' && isVersionLower(appVersionGlobal, "1.0.3"))) {
                    if (isiOS) {
                        window.webkit.messageHandlers.LaunchOfflineVideo.postMessage(null);
                    }
                    else if (isAndroid) {
                        Android.LaunchOfflineVideo();
                    }
                }
                else {
                    getUserData()
                        .then(userData => {
                            if (!userData.apiKey || userData.apiKey.trim() === "" || appApiKeyGlobal !== userData.apiKey) {
                                return setUserData(appApiKeyGlobal, appRegistrationNoGlobal, studentNameGlobal, userTypeGlobal);
                            }
                        })
                        .then(() => {
                            if (isiOS) {
                                window.webkit.messageHandlers.LaunchOfflineVideo.postMessage(null);
                            }
                            else if (isAndroid) {
                                Android.LaunchOfflineVideo();
                            }
                        })
                        .catch(error => {
                            console.error("flow failed:", error);
                        });
                }
            }
            else{
                if (isDesktop) {
                    if (window.chrome && window.chrome.webview) {
                        window.chrome.webview.postMessage(JSON.stringify({
                            MessageType: "LaunchOfflineVideo",
                            Payload: "abc"
                        }));
                    }
                }
                else if (isMacOS || isLinux) {
                    if (window.external && typeof window.external.sendMessage === 'function') {
                        window.external.sendMessage(JSON.stringify({
                            MessageType: "LaunchOfflineVideo",
                            Payload: "abc"
                        }));
                    }
                }
            }
        }
    });
