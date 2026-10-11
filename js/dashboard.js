var intervals = [];

function n(n) {
    return n > 9 ? "" + n : "0" + n;
}

function ClassCountStatusUpdate() {
    let totalCardCount = $('#collapse_1 .dashboard-routine-item').length;
    let liveItemCount = $('#collapse_1 .dashboard-routine-item[data-is-live="true"]').length;
    let upcomingCount = parseInt(totalCardCount - liveItemCount);
    let content =
        (liveItemCount !== 0 && upcomingCount !== 0) ?
            `${liveItemCount} Live, ${upcomingCount} Upcoming` :
            (liveItemCount === 0) ?
                `${upcomingCount} Upcoming` :
                (upcomingCount === 0) ?
                    `${liveItemCount} Live` :
                    '';

    $('.class-count-status').html(content);
}
function ExamCountStatusUpdate() {
    let totalCardCount = $('#collapse_2 .dashboard-routine-item').length;
    let liveItemCount = $('#collapse_2 .dashboard-routine-item[data-is-live="true"]').length;
    let upcomingCount = parseInt(totalCardCount - liveItemCount);
    let content =
        (liveItemCount !== 0 && upcomingCount !== 0) ?
            `${liveItemCount} Running, ${upcomingCount} Upcoming` :
            (liveItemCount === 0) ?
                `${upcomingCount} Upcoming` :
                (upcomingCount === 0) ?
                    `${liveItemCount} Running` :
                    '';

    $('.exam-count-status').html(content);
}
function CountDown(dataType) {
    var box = $(".classRoutineBox");
    if (dataType == "data-examId") {
        box = $(".examRoutineBox");
    }
    box.each(function () {
        var box = $(this);
        var startDateTime = box.attr('data-start-datetime');
        var serverDateTime = box.attr('data-server-datetime');
        if (startDateTime == "" || serverDateTime == "") { return; }

        var dataTypeId = box.attr(dataType);
        var studentProgramId = box.attr('data-studentProgramId');
        var courseId = box.attr('data-courseid');
        var isInteractive = box.attr('data-is-interactive');
        var routineId = box.attr('data-routineid');
        var batchId = box.attr('data-batchId');
        var countDownDate = moment(startDateTime);
        var serverDate = moment(serverDateTime);
        var iterate = 0;
        var targetedBox = "#countDownShow_" + courseId + "_" + dataTypeId + "_" + routineId + "_" + batchId;
        // Update the count down every 1 second
        var iterate = 0;
        var x = setInterval(function () {

            // Get today's date and time
            var now = serverDate + iterate * 1000;
            iterate++;
            // Find the distance between now and the count down date
            var distance = countDownDate - now;
            // Time calculations for days, hours, minutes and seconds
            var days = Math.floor(distance / (1000 * 60 * 60 * 24));
            var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // If the count down is over, write some text
            if (distance < 0) {
                clearInterval(x);
                $(targetedBox).html("<span class='red-circle mr-2'></span><span>Live Now</span>");

                if (dataType == "data-examId") {
                    $(targetedBox).parents('.dashboard-routine-item').attr('data-is-live', 'true');
                    $(targetedBox).parents('.dashboard-routine-item').find('.takeExam').removeClass("btn-info").addClass("btn-success");
                    $(targetedBox).parents('.dashboard-routine-item').find('.not-taken').html("You haven't taken the exam yet");
                    //$(targetedBox).html("Take Exam");
                    $(targetedBox).parents('.dashboard-routine-item').find('.takeExam').removeClass("disabled");
                    $(targetedBox).parents('.dashboard-routine-item').find('.takeExam').attr("href", "/Exam/TakeExam?courseId=" + courseId + "&routineId=" + routineId + "&examId=" + dataTypeId + "&studentProgramId=" + studentProgramId);
                    ExamCountStatusUpdate();
                }
                else {
                    $(targetedBox).parents('.dashboard-routine-item').attr('data-is-live', 'true');
                    if (isInteractive == "True") {
                        let url = "/Routine/JoinInteractiveClass?courseId=" + courseId + "&routineId=" + routineId + "&studentProgramId=" + studentProgramId;
                        var content = `<a class="btn joinInteractiveClass" style="color:#fff;" href="${url}"
id="JoinClass_${routineId}" data-routineid="${routineId}" data-courseid="${courseId}" data-studentprogramid="${studentProgramId}">Join Now</a>`
                        //$(targetedBox).parent().html(content);
                        $(targetedBox).parents('.dashboard-routine-item').find('.card-footer').html(content);
                    }
                    else {
                        $(targetedBox).parents('.dashboard-routine-item').find('.joinClass').removeClass("btn-info").addClass("btn-success");
                        //$(targetedBox).parents('.dashboard-routine-item').find('.joinClass').html("Join Class");
                        $(targetedBox).parents('.dashboard-routine-item').find('.joinClass').removeClass("disabled");
                        $(targetedBox).parents('.dashboard-routine-item').find('.joinClass').attr("data-routineId", routineId);
                        $(targetedBox).parents('.dashboard-routine-item').find('.joinClass').attr("data-courseId", courseId);
                        $(targetedBox).parents('.dashboard-routine-item').find('.joinClass').attr("data-studentProgramId", studentProgramId);
                    }
                    ClassCountStatusUpdate();
                }
            }
            else {
                //console.log('distance', distance);
                if (dataType == "data-examId") {
                    var targetedBoxId = "countDownShow_" + courseId + "_" + dataTypeId + "_" + routineId + "_" + batchId;
                    // Output the result in an element with id
                    var element = document.getElementById(targetedBoxId);

                    //If it isn't "undefined" and it isn't "null", then it exists.
                    if (typeof (element) != 'undefined' && element != null) {
                        document.getElementById(targetedBoxId).innerHTML = n(minutes) + ":" + n(seconds);
                    }
                }
                else {
                    // Output the result in an element with id
                    var targetedBoxId = "countDownShow_" + courseId + "_" + dataTypeId + "_" + routineId + "_" + batchId;
                    var element = document.getElementById(targetedBoxId);

                    //If it isn't "undefined" and it isn't "null", then it exists.
                    if (typeof (element) != 'undefined' && element != null) {
                        document.getElementById(targetedBoxId).innerHTML = n(minutes) + ":" + n(seconds);
                    }
                }
            }
        }, 1000);

        intervals.push(x);
    });
}
function LoadRoutine() {

    $("#lecture").empty();

    $.ajax({
        url: "/Dashboard/LiveClassAjax",
        type: "POST",
        beforeSend: function () {
            $.blockUI({
                timeout: 0,
                message: '<h1><img src="/Content/Image/ajax-loader.gif" /> Processing...</h1>'
            });
        },
        success: function (data) {
            $.unblockUI();
            if (data.hasOwnProperty("IsSuccess")) {
                if (data.IsSuccess == false) {
                    window.location.href = "/Account/Logout";
                }
            }

            $("#lecture").html(data);
        },
        complete: function () {
            $.unblockUI();
        },
        error: function (data) {
            $.unblockUI();
        }
    });
}

$(document).ready(function () {

    CountDown("data-lectureId");
    CountDown("data-examId");

    /* Accordion Collapse Show Top Start*/
    $('#collapse_1').on('shown.bs.collapse', function () {
        $('#collapse_head_1')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#collapse_2').on('shown.bs.collapse', function () {
        $('#collapse_head_2')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#collapse_1').on('shown.bs.collapse', function () {
        var stickyHeaderHeight = $('#collapse_1').outerHeight();
        var targetScrollPosition = $('#collapse_1').offset().top - stickyHeaderHeight;
        window.scroll({
            top: targetScrollPosition,
            behavior: 'smooth'
        });
    });
    $('#collapse_2').on('shown.bs.collapse', function () {
        var stickyHeaderHeight = $('#collapse_2').outerHeight();
        var targetScrollPosition = $('#collapse_2').offset().top - stickyHeaderHeight;
        window.scroll({
            top: targetScrollPosition,
            behavior: 'smooth'
        });
    });
    /* Accordion Collapse Show Top End*/
    //back button click
    //if (performance.navigation.type == 2) {
    //    window.location.reload(true);
    //}
    $(document).on("click", ".custom-message-box .btn-message-close", function () {
        $(this).parents('.custom-message-box').remove();
    });
});

$(document).on("click", "#fbjoinbtn", function () {

    var antyForgery = gettoken();

    $.ajax({
        url: "/Dashboard/JoinFacebookGroup",
        type: "POST",
        data: { __RequestVerificationToken: antyForgery },
        beforeSend: function () {

        },
        success: function (data) {
            $.unblockUI();
            if (data.hasOwnProperty("AutoLogout")) {
                if (data.AutoLogout == true) {
                    window.location.href = "/Account/Logout";
                }
            }
        },
        complete: function () {

        },
        error: function (data) {

        }
    });
});

$(document).on("click", ".live-class-btn .joinClass", function (event) {
    var courseId = $(this).attr('data-courseId');
    var routineId = $(this).attr('data-routineId');
    var studentProgramId = $(this).attr('data-studentProgramId');
    let appId = $("#topHeader").attr("data-app-id");
    if (routineId != null && routineId > 0) {
        // Open window immediately for iOS compatibility
        //var newWindow = window.open('', '_blank');

        $.ajax({
            url: "/Routine/JoinClass",
            type: "POST",
            data: { routineId: routineId, courseId: courseId, studentProgramId: studentProgramId },
            beforeSend: function () {
                $.blockUI({
                    timeout: 0,
                    message: '<h1><img src="/Content/Image/ajax-loader.gif" /> Processing...</h1>'
                });
            },
            success: function (result) {
                $.unblockUI();

                if (result.IsSuccess == false) {
                    //if (newWindow) newWindow.close(); // Close blank window on error
                    if (result.message == 'Multiple login found.') {
                        window.location.href = "/Account/Logout";
                    }
                    else {
                        $.fn.customMessage({
                            displayMessage: result.Message,
                            displayMessageType: "e",
                        });
                    }
                } else {
                    if (result.IsYoutubeLive == false) {
                        // Platform check: Determines how to open the Zoom link                       

                        if (appId != '' && (isMacOS || isLinux)) {
                            let href = result.Data;

                            let tempLink = document.createElement("a");
                            tempLink.href = href;
                            tempLink.target = "_blank";
                            tempLink.rel = "noopener noreferrer";
                            document.body.appendChild(tempLink);
                            tempLink.click();
                            document.body.removeChild(tempLink);
                        }
                        else if (appId != '' && isDesktop) {
                            window.chrome.webview.postMessage(JSON.stringify({
                                MessageType: "OpenUrlInDefaultBrowser",
                                Payload: { "onlineUrl": result.Data }
                            }));
                        } else {
                            window.location.href = result.Data;
                        }
                    }
                    else {
                        //if (newWindow) newWindow.close();
                        window.location.href = "/Routine/ViewYoutubeLive?courseId=" + courseId + "&routineId=" + routineId + "&studentProgramId=" + studentProgramId;
                    }
                }
            },
            complete: function () {
                $.unblockUI();
            },
            error: function (data) {
                $.unblockUI();
                //if (newWindow) newWindow.close();
            }
        });
    }
});