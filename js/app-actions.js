
            $('#backButtonContainer').remove();
            $(document).ready(function () {
                $(document).on('click', '.app-btn-desktop-copy', function () {
                    let downloadUrl = $(this).data('href');
                    let $btn = $(this);
                    let originalText = $btn.text();

                    if (isDesktop && downloadUrl) {
                        // Copy URL to clipboard
                        navigator.clipboard.writeText(downloadUrl).then(function() {
                            // Change button text to "Copied"
                            $btn.text('Copied');

                            // Revert back to original text after 2 seconds
                            setTimeout(function() {
                                $btn.text(originalText);
                            }, 2000);
                        }).catch(function(err) {
                            // Fallback for older browsers
                            var tempInput = document.createElement('input');
                            tempInput.value = downloadUrl;
                            document.body.appendChild(tempInput);
                            tempInput.select();
                            document.execCommand('copy');
                            document.body.removeChild(tempInput);

                            // Change button text to "Copied"
                            $btn.text('Copied');

                            // Revert back to original text after 2 seconds
                            setTimeout(function() {
                                $btn.text(originalText);
                            }, 2000);
                        });
                    }
                });

                // Close button handler for desktop overlay popups only (Windows, Mac, Linux)
                $(document).on('click', '.btn-close-overlay', function () {
                    var $backdrop = $(this).closest('.position-fixed');
                    var overlayClass = '';

                    if ($backdrop.hasClass('overlay-backdrop-windows')) {
                        overlayClass = 'windows';
                    } else if ($backdrop.hasClass('overlay-backdrop-mac')) {
                        overlayClass = 'mac';
                    } else if ($backdrop.hasClass('overlay-backdrop-linux')) {
                        overlayClass = 'linux';
                    }

                    // Hide the entire backdrop (which contains the overlay)
                    $backdrop.hide();

                    // Store in sessionStorage (will be cleared when app/browser closes)
                    if (overlayClass) {
                        sessionStorage.setItem('updateOverlay_' + overlayClass + '_dismissed', 'true');
                    }
                });

                // Check sessionStorage before showing overlays (desktop only)
                function checkOverlayStatus() {
                    var platforms = ['windows', 'mac', 'linux'];
                    platforms.forEach(function(platform) {
                        var isDismissed = sessionStorage.getItem('updateOverlay_' + platform + '_dismissed');
                        if (isDismissed === 'true') {
                            $('.overlay-backdrop-' + platform).hide();
                        }
                    });
                }

                // Check overlay status on page load
                checkOverlayStatus();

                detectDevice();
                $(document).on('click', '.btn-app-info .btn-ios', function () {
                    $('.ios-info-div').toggleClass('d-none');
                });
                $(document).on('click', '.btn-app-info .btn-ios-info-close', function () {
                    $('.ios-info-div').toggleClass('d-none');
                });
            })
            function detectDevice() {
                // Check if device detection variables are defined
                var isAndroidDevice = typeof isAndroid !== 'undefined' && isAndroid;
                var isiOSDevice = typeof isiOS !== 'undefined' && isiOS;
                var isMacOSDevice = typeof isMacOS !== 'undefined' && isMacOS;
                var isLinuxDevice = typeof isLinux !== 'undefined' && isLinux;
                var isDesktopDevice = typeof isDesktop !== 'undefined' && isDesktop;

                // For app environment, check the app-btn href attribute in update overlay divs
                var androidLink = $('.block-app-overlay .app-btn').attr('href') || $('.btn-android').attr('href');
                var iosLink = $('.block-app-overlay-ios .app-btn').attr('href') || $('.btn-ios').attr('href');
                var windowsLink = $('.block-app-overlay-windows .app-btn').attr('data-href') || $('.btn-windows').attr('href');
                var macLink = $('.block-app-overlay-mac .app-btn').attr('href') || $('.btn-mac').attr('href');
                var linuxLink = $('.block-app-overlay-linux .app-btn').attr('href') || $('.btn-linux').attr('href');
                var testFlightLink = $('.ios-info-div .test-flight-link').attr('href');
                var mainIosLink = $('.ios-info-div .main-link').attr('href');

                if (isiOSDevice && (testFlightLink || mainIosLink || iosLink)) {
                    $('.btn-app-info').removeClass('d-none');
                    $('.btn-app-info .btn-ios').removeClass('d-none');
                    $('.btn-app-info .btn-android').remove();
                    $('.btn-app-info .btn-windows').remove();
                    $('.btn-app-info .btn-mac').remove();
                    $('.btn-app-info .btn-linux').remove();
                    $('.overlay-backdrop').remove();
                    $('.overlay-backdrop-windows').remove();
                    $('.overlay-backdrop-mac').remove();
                    $('.overlay-backdrop-linux').remove();
                    // Always show iOS overlay - no session check
                    $('.overlay-backdrop-ios').css('display', 'flex');
                } else if (isAndroidDevice && androidLink) {
                    $('.btn-app-info').removeClass('d-none');
                    $('.btn-app-info .btn-android').removeClass('d-none');
                    $('.btn-app-info .btn-ios').remove();
                    $('.btn-app-info .btn-windows').remove();
                    $('.btn-app-info .btn-mac').remove();
                    $('.btn-app-info .btn-linux').remove();
                    $('.overlay-backdrop-ios').remove();
                    $('.overlay-backdrop-windows').remove();
                    $('.overlay-backdrop-mac').remove();
                    $('.overlay-backdrop-linux').remove();
                    // Always show Android overlay - no session check
                    $('.overlay-backdrop').css('display', 'flex');
                    $('.beta-text').remove();
                } else if (isMacOSDevice && macLink) {
                    $('.btn-app-info').removeClass('d-none');
                    $('.btn-app-info .btn-mac').removeClass('d-none');
                    $('.btn-app-info .btn-android').remove();
                    $('.btn-app-info .btn-ios').remove();
                    $('.btn-app-info .btn-windows').remove();
                    $('.btn-app-info .btn-linux').remove();
                    $('.overlay-backdrop').remove();
                    $('.overlay-backdrop-ios').remove();
                    $('.overlay-backdrop-windows').remove();
                    $('.overlay-backdrop-linux').remove();
                    // Check if overlay was dismissed in this session
                    var isDismissed = sessionStorage.getItem('updateOverlay_mac_dismissed');
                    if (isDismissed !== 'true') {
                        $('.overlay-backdrop-mac').css('display', 'flex');
                    }
                } else if (isLinuxDevice && linuxLink) {
                    $('.btn-app-info').removeClass('d-none');
                    $('.btn-app-info .btn-linux').removeClass('d-none');
                    $('.btn-app-info .btn-android').remove();
                    $('.btn-app-info .btn-ios').remove();
                    $('.btn-app-info .btn-windows').remove();
                    $('.btn-app-info .btn-mac').remove();
                    $('.overlay-backdrop').remove();
                    $('.overlay-backdrop-ios').remove();
                    $('.overlay-backdrop-windows').remove();
                    $('.overlay-backdrop-mac').remove();
                    // Check if overlay was dismissed in this session
                    var isDismissed = sessionStorage.getItem('updateOverlay_linux_dismissed');
                    if (isDismissed !== 'true') {
                        $('.overlay-backdrop-linux').css('display', 'flex');
                    }
                } else if (isDesktopDevice && windowsLink) {
                    // isDesktop means Windows or other non-Mac/Linux desktop OS
                    $('.btn-app-info').removeClass('d-none');
                    $('.btn-app-info .btn-windows').removeClass('d-none');
                    $('.btn-app-info .btn-android').remove();
                    $('.btn-app-info .btn-ios').remove();
                    $('.btn-app-info .btn-mac').remove();
                    $('.btn-app-info .btn-linux').remove();
                    $('.overlay-backdrop').remove();
                    $('.overlay-backdrop-ios').remove();
                    $('.overlay-backdrop-mac').remove();
                    $('.overlay-backdrop-linux').remove();
                    // Check if overlay was dismissed in this session
                    var isDismissed = sessionStorage.getItem('updateOverlay_windows_dismissed');
                    if (isDismissed !== 'true') {
                        $('.overlay-backdrop-windows').css('display', 'flex');
                    }
                } else {
                    // If no app available for the detected platform, hide everything
                    $('.btn-app-info').addClass('d-none');
                    $('.overlay-backdrop').hide();
                    $('.overlay-backdrop-ios').hide();
                    $('.overlay-backdrop-windows').hide();
                    $('.overlay-backdrop-mac').hide();
                    $('.overlay-backdrop-linux').hide();
                }
            }
        