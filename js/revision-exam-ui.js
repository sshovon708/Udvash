
    $(document).on("click", ".revision-btn", function (event) {
        event.preventDefault();

        let btn = $(this);

        if (btn.attr("data-disabled") === "true") {
            return;
        }

        let modalId = btn.data("modal-id");
        let requestDto = {
            ProgramId: btn.data("program-id"),
            SessionId: btn.data("session-id"),
            CourseId: btn.data("course-id")
        };

        btn.prop("disabled", true).text("Loading...");

        $.ajax({
            url: '/Performance/StudentCourseWiseExamRevisionCardInfo',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestDto),
            beforeSend: function () {
                $.blockUI({ timeout: 0, message: '<h1><img src="/Content/Image/ajax-loader.gif" /> Processing...</h1>' });
            },
            success: function (response) {
                if (response && response.isSuccess) {
                    let html = renderRevisionModalContent(response.data, response.subjectList);
                    if (modalId && $(modalId).length) {
                        $(modalId).find('.modal-body').html(html);
                        if (response.data.IsAlreadyVisited) {
                            $(modalId).find('input[type="radio"][value="resume"]').trigger('change');
                        }
                        $(modalId).modal('show');
                    } else {
                        console.warn('Revision modal not found:', modalId);
                    }
                } else {
                    let message = response && response.message ? response.message : 'Something went wrong';
                    $.fn.customMessage({ displayMessage: message, displayMessageType: 'e' });
                }
            },
            error: function (xhr) {
                $.fn.customMessage({ displayMessage: 'Something went wrong', displayMessageType: 'e' });
            },
            complete: function () {
                $.unblockUI();
                btn.prop('disabled', false).text('Examwise Quick Revision');
            }
        });
    });

    function renderRevisionModalContent(data, subjectList) {
        if (!data) {
            return `<div class="text-danger">Unable to load revision data.</div>`;
        }

        let subjectOptions = `<option value="0">All Subject</option>`;
        let resumeSubjectId = 0;
        if (subjectList && subjectList.length) {
            subjectList.forEach(function (item) {
                if (item.Selected) resumeSubjectId = item.Value;
                subjectOptions += `<option value="${item.Value}">${item.Text}</option>`;
            });
        }

        let visitedStatus = data.IsAlreadyVisited;
        let availableStatus = data.IsAvailableForRevision;

        let totalQuestion = data.TotalQuestionCount || 0;
        let viewedQuestion = data.TotalViewedQuestionCount || 0;
        let totalExam = data.TotalPerticipatedExam || 0;
        let visitedExam = data.VisitedExamCount || 0;
        let progressPercent = totalQuestion > 0 ? Math.round((viewedQuestion / totalQuestion) * 100) : 0;

        return `
            <div class="card bg-transparent border-0">
                <div class="card-body p-0">
                    <p style="font-weight: 500">${data.CourseName}</p>
                    <div>
                        <span style="font-weight: 500">Start Mode</span><br/>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="mode_${data.CourseId}" id="start_${data.CourseId}" value="start" ${!visitedStatus ? "checked" : ""}>
                            <label class="form-check-label" for="start_${data.CourseId}">Start From Beginning</label>
                        </div>
                        <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="mode_${data.CourseId}" id="resume_${data.CourseId}" value="resume" data-subject-id="${resumeSubjectId}" data-question-status='${JSON.stringify(data.QuestionStatus || [])}' ${visitedStatus ? "checked" : "disabled"}>
                            <label class="form-check-label" for="resume_${data.CourseId}">Resume From Previous</label>
                        </div>
                    </div>
                    <p class="small text-muted no-session-msg" ${visitedStatus ? 'style="display:none;"' : ''}>কোনো পূর্ববর্তী session পাওয়া যায়নি</p>
                    <p class="small text-muted auto-set-msg" ${visitedStatus ? '' : 'style="display:none;"'}>আগের session এর Subject ও Status auto-set করা হয়েছে</p>
                    <div class="mb-3">
                        <span style="font-weight: 500">Subject</span><br />
                        <select class="form-select w-100 border-secondary rounded p-2 revision-subject-select">${subjectOptions}</select>
                    </div>
                        <div>
                            <span style="font-weight: 500">Question Status</span><br />
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input revision-status-checkbox"
                                               type="checkbox"
                                               name="status"
                                               id="status_10"
                                               value="10"
                                               >

                                        <label class="form-check-label" for="status_10">
                                            Correct
                                        </label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input revision-status-checkbox"
                                               type="checkbox"
                                               name="status"
                                               id="status_20"
                                               value="20"
                                               checked>

                                        <label class="form-check-label" for="status_20">
                                            Incorrect
                                        </label>
                                    </div>
                                    <div class="form-check form-check-inline">
                                        <input class="form-check-input revision-status-checkbox"
                                               type="checkbox"
                                               name="status"
                                               id="status_30"
                                               value="30"
                                               checked>

                                        <label class="form-check-label" for="status_30">
                                            Skipped
                                        </label>
                                    </div>
                        </div>
                    <p class="small text-muted">কমপক্ষে একটি status অবশ্যই নির্বাচন করতে হবে</p>
                    <div class="progress-card border border-primary rounded p-3 mt-2" style="background-color: #E6F0FA; ${visitedStatus ? '' : 'display: none;'}">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <span style="font-weight: 500">Progress</span>
                            <span class="badge border border-primary text-primary rounded-pill px-3 py-1" style="background-color: transparent; font-weight: 500;">${viewedQuestion}/${totalQuestion} Questions Completed</span>
                        </div>
                        <div class="mb-2">
                            মোট <strong>${totalExam}</strong> টি Exam এর মধ্যে <strong>${visitedExam}</strong> টি Exam এর Revision complete হয়েছে
                        </div>
                        <div class="progress" style="height: 8px;">
                            <div class="progress-bar bg-primary" role="progressbar" style="width: ${progressPercent}%" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </div>
                </div>
                <div class="card-footer d-flex bg-transparent border-0 justify-content-end">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary ml-2 btn-start-revision" data-program-id="${data.ProgramId}" data-session-id="${data.SessionId}" data-course-id="${data.CourseId}" data-total-exam="${data.TotalPerticipatedExam || 0}" data-visited-exam="${data.VisitedExamCount || 0}">Start Revision</button>
                </div>
            </div>
        `;
    }

    $(document).on("change", 'input[type="radio"][name^="mode_"]', function () {
        let modalBody = $(this).closest('.modal-body');
        let isResume = $(this).val() === "resume";
        let isStart = $(this).val() === "start";

        modalBody.find('.auto-set-msg').toggle(isResume);
        modalBody.find('.no-session-msg').hide();
        modalBody.find('.progress-card').toggle(isResume);

        let subjectSelect = modalBody.find('.revision-subject-select');
        let statusCheckboxes = modalBody.find('input[type="checkbox"][name="status"]');

        if (isStart) {
            subjectSelect.val("0").prop('disabled', false);
            statusCheckboxes.each(function () {
                let val = $(this).val();
                $(this).prop('checked', val === "20" || val === "30").prop('disabled', false);
            });
        } else if (isResume) {
            let resumeRadio = modalBody.find('input[type="radio"][value="resume"]');
            let prevSubjectId = resumeRadio.attr('data-subject-id') || "0";
            let prevStatusJson = resumeRadio.attr('data-question-status') || "[]";
            let prevStatus = [];
            try { prevStatus = JSON.parse(prevStatusJson); } catch (e) { prevStatus = []; }

            subjectSelect.val(String(prevSubjectId)).prop('disabled', true);
            statusCheckboxes.each(function () {
                let val = parseInt($(this).val(), 10);
                $(this).prop('checked', prevStatus.indexOf(val) !== -1).prop('disabled', true);
            });
        }
    });

    $(document).on("change", 'input[type="checkbox"][name="status"]', function () {
        let modalBody = $(this).closest('.modal-body');
        let checkedCount = modalBody.find('input[type="checkbox"][name="status"]:checked').length;

        if (checkedCount === 0) {
            $(this).prop('checked', true);
        }
    });

    $(document).on("click", ".btn-start-revision", function () {
        let btn = $(this);
        let modal = btn.closest('.modal');
        let modalBody = btn.closest('.modal-body');

        let selectedMode = modalBody.find('input[type="radio"][name^="mode_"]:checked').val();
        if (!selectedMode) {
            $.fn.customMessage({ displayMessage: 'Start Mode অবশ্যই নির্বাচন করতে হবে', displayMessageType: 'e' });
            return;
        }

        let isForResume = selectedMode === "resume";
        let subjectId = parseInt(modalBody.find('.revision-subject-select').val(), 10) || 0;
        let questionStatus = [];
        modalBody.find('input[type="checkbox"][name="status"]:checked').each(function () {
            questionStatus.push(parseInt($(this).val(), 10));
        });

        let requestDto = {
            ProgramId: btn.data("program-id"),
            SessionId: btn.data("session-id"),
            CourseId: btn.data("course-id"),
            IsForResume: isForResume,
            IsNext: true,
            ExamId: 0,
            SubjectId: subjectId,
            QuestionStatus: questionStatus,
            IsFinished: false
        };

        btn.prop('disabled', true).text('Loading...');

        $.ajax({
            url: '/Exam/RevisionExamQuestionAnswerInfo',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestDto),
            beforeSend: function () {
                $.blockUI({ timeout: 0, message: '<h1><img src="/Content/Image/ajax-loader.gif" /> Processing...</h1>' });
            },
            success: function (response) {
                if (response && response.isSuccess) {
                    if (modal.length) {
                        modal.modal('hide');
                    }
                    let totalExamCount = parseInt(btn.data("total-exam"), 10) || 0;
                    let visitedExamCount = parseInt(btn.data("visited-exam"), 10) || 0;
                    let currentExamIndex = isForResume ? (visitedExamCount >= totalExamCount ? 1 : (visitedExamCount + 1)) : 1;
                    let navParams = {
                        programId: btn.data("program-id"),
                        sessionId: btn.data("session-id"),
                        courseId: btn.data("course-id"),
                        subjectId: subjectId,
                        questionStatus: questionStatus,
                        isForResume: isForResume,
                        totalExamCount: totalExamCount,
                        currentExamIndex: currentExamIndex
                    };
                    renderRevisionContent(response, navParams);
                    $('#performanceReportContent').hide();
                    $('#revisionContent').show();
                    $('html, body').animate({ scrollTop: 0 }, 400);
                } else {
                    let message = response && response.message ? response.message : 'Something went wrong';
                    modalBody.find('.revision-modal-error').remove();
                    modalBody.prepend(`<div class="revision-modal-error alert alert-danger mb-2">${message}</div>`);
                }
            },
            error: function (xhr) {
                modalBody.find('.revision-modal-error').remove();
                modalBody.prepend(`<div class="revision-modal-error alert alert-danger mb-2">Something went wrong</div>`);
            },
            complete: function () {
                $.unblockUI();
                btn.prop('disabled', false).text('Start Revision');
            }
        });
    });

    $(document).on("click", "#backToPerformanceDetails", function () {
        $('#revisionContent').hide();
        $('#performanceReportContent').show();
        $('html, body').animate({ scrollTop: 0 }, 400);
    });
