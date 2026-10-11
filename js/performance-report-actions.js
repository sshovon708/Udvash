
        $(document).ready(function () {

        });

        $(document).on("change", "#CourseId", function () {

            var courseId = $(this).val();
            var programId = 162;
            var sessionId = 66;
            //console.log('change', courseId);

            $("#SubjectId option").remove();
            $('#SubjectId').append("<option value='0'>All Subject</option>");

            $.ajax({
                url: $("body").attr("data-project-root") + "Performance/LoadSubject",
                type: "POST",
                data: { courseId: courseId, programId: programId, sessionId: sessionId },
                beforeSend: function () {
                    $.blockUI({
                        timeout: 0,
                        message: '<h1><img src="/Content/Image/ajax-loader.gif" /> Processing...</h1>'
                    });
                },
                success: function (response) {
                    if (response.IsSuccess) {
                        //console.log('response.subjectSelectList', response.subjectSelectList);
                        if (response.subjectSelectList != null && response.subjectSelectList.length > 0) {
                            $.each(response.subjectSelectList, function (i, v) {
                                $('#SubjectId').append($('<option>').text(v.Text).attr('value', v.Value));
                            });
                            $("#SubjectId").find('option:eq(0)').prop('selected', true);
                        }
                    }
                    else {
                        $.fn.customMessage({
                            displayMessage: response.Message,
                            displayMessageType: "e",
                        });
                    }
                    $.unblockUI();
                },
                complete: function () {
                    $.unblockUI();
                },
                error: function (response) { }
            });
        });

        $(document).on("click", "#btnReport", function (e) {
            e.preventDefault();

            var courseId = $("#CourseId").val();
            var subjectId = $("#SubjectId").val();
            var examPlatform = $("#ExamPlatform").val();
            var examStatus = $("#ExamAttendance").val();

            var urlParam = {
                programId: 162,
                sessionId: 66,
                isOnline: 0,
                courseId: courseId,
                subjectId: subjectId,
                examPlatform: examPlatform,
                examStatus: examStatus
            };

            var url = "/Performance/Report";
            url += "?" + decodeURIComponent($.param(urlParam, true));

            window.location.href = url;
        });


    