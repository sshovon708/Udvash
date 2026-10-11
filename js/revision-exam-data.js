
    var _revisionNavParams = null;
    var _revisionCurrentExamId = 0;
    var _revisionCurrentIndex = 0;
    var _revisionAllQuestions = [];
    var _revisionRenderedCount = 0;
    var _revisionBatchSize = 20;
    var _revisionObserver = null;

    function showRevisionError(msg) {
        var $wrapper = $('#revisionContent .TakeExamWrapper');
        $wrapper.find('.revision-page-error').remove();
        $wrapper.prepend(`<div class="revision-page-error alert alert-danger">${msg}</div>`);
        $('html, body').animate({ scrollTop: 0 }, 400);
    }

    function renderRevisionContent(response, navParams) {
        _revisionNavParams = navParams;
        _revisionCurrentIndex = navParams.currentExamIndex;

        $('#revisionContent .TakeExamWrapper').find('.revision-page-error').remove();

        var data = response.data;
        if (!data) return;

        _revisionCurrentExamId = data.ExamId;

        $('#revisionMetaInfo').html(`
            <h2 class="revision-course-title">${data.CourseName || ''}</h2>
            <div class="revision-subtitle">Revision</div>
            <div class="revision-meta">Subject: <strong>${response.subjectName || 'All'}</strong> &nbsp;|&nbsp; Exam <strong>${response.currentExamIndex}</strong> of <strong>${response.totalFilteredExamCount}</strong></div>
        `);

        var examDate = data.ExamStartDateTime ? formatRevisionDate(new Date(data.ExamStartDateTime)) : '';

        var qs = navParams.questionStatus || [];
        var ri = data.ResultInfo || {};
        var badgesHtml = '';
        if (qs.indexOf(10) !== -1) badgesHtml += `<span class="revision-status-badge">Correct: ${ri.TotalCorrectAnswer}</span>`;
        if (qs.indexOf(20) !== -1) badgesHtml += `<span class="revision-status-badge">Incorrect: ${ri.TotalWrongAnswer}</span>`;
        if (qs.indexOf(30) !== -1) badgesHtml += `<span class="revision-status-badge">Skipped: ${ri.TotalSkip}</span>`;

        $('#revisionExamHeader').html(`
            <h4>${data.ExamName || ''}</h4>
            <div class="exam-date">${examDate}</div>
            <div>${badgesHtml}</div>
        `);

        _revisionAllQuestions = [];
        _revisionRenderedCount = 0;
        if (_revisionObserver) { _revisionObserver.disconnect(); _revisionObserver = null; }

        if (data.ExamQuestionDetailList && data.ExamQuestionDetailList.length > 0) {
            data.ExamQuestionDetailList.forEach(function (q) { _revisionAllQuestions.push({ type: 'mcq', data: q }); });
        }
        if (data.OnlineWrittenExamQuestionDetailList && data.OnlineWrittenExamQuestionDetailList.length > 0) {
            data.OnlineWrittenExamQuestionDetailList.forEach(function (q) { _revisionAllQuestions.push({ type: 'written', data: q }); });
        }
        if (data.SaqExamQuestionDetailList && data.SaqExamQuestionDetailList.length > 0) {
            data.SaqExamQuestionDetailList.forEach(function (q) { _revisionAllQuestions.push({ type: 'written', data: q }); });
        }

        $('#revisionQuestionList').html('');
        if (_revisionAllQuestions.length === 0) {
            $('#revisionQuestionList').html(`
                <div class="text-center py-5">
                    <i class="fa fa-file-o fa-3x text-muted mb-3" style="display:block; margin-bottom:12px;"></i>
                    <p class="text-muted" style="font-size:16px;">Revision Settings অনুযায়ী এই Exam এর জন্য কোনো প্রশ্ন পাওয়া যায়নি।</p>
                </div>`);
        } else {
            renderNextRevisionBatch();
        }

        $('#revisionPagination').text(`${response.currentExamIndex} / ${response.totalFilteredExamCount}`);
        $('#revisionPrevBtn').prop('disabled', response.currentExamIndex <= 1).text('< Previous');

        var isLastExam = response.currentExamIndex >= response.totalFilteredExamCount;
        if (isLastExam) {
            $('#revisionNextBtn').hide();
            $('#revisionFinishBtn').show().prop('disabled', false).text('Finish');
        } else {
            $('#revisionNextBtn').show().prop('disabled', false).text('Next >');
            $('#revisionFinishBtn').hide();
        }
    }

    function renderNextRevisionBatch() {
        var start = _revisionRenderedCount;
        var end = Math.min(start + _revisionBatchSize, _revisionAllQuestions.length);

        var html = '';
        for (var i = start; i < end; i++) {
            var item = _revisionAllQuestions[i];
            html += item.type === 'mcq' ? buildRevisionMcqHtml(item.data) : buildRevisionWrittenHtml(item.data);
        }
        _revisionRenderedCount = end;

        $('#revisionQuestionList').append(html);

        if (typeof MathJax !== 'undefined' && MathJax.typesetPromise) {
            MathJax.typesetPromise([document.getElementById('revisionQuestionList')]);
        }

        if (_revisionRenderedCount < _revisionAllQuestions.length) {
            var sentinel = document.createElement('div');
            sentinel.className = 'revision-sentinel';
            document.getElementById('revisionQuestionList').appendChild(sentinel);

            _revisionObserver = new IntersectionObserver(function (entries) {
                if (entries[0].isIntersecting) {
                    _revisionObserver.disconnect();
                    _revisionObserver = null;
                    renderNextRevisionBatch();
                }
            }, { rootMargin: '200px' });

            _revisionObserver.observe(sentinel);
        }
    }

    function formatRevisionDate(d) {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
    }

    function getRevisionOptionClass(letter, q) {
        var correct = (q.CorrectAnswer || '').toLowerCase();
        var student = (q.StudentAnswer || '').toLowerCase();
        var l = letter.toLowerCase();
        if (l === correct) return 'AnsTrue';
        if (l === student) return 'AnsFalse StudentAns';
        return '';
    }

    function buildRevisionOptionHtml(letter, text, q) {
        if (!text) return '';
        var cls = getRevisionOptionClass(letter, q);
        var checkIcon = cls === 'AnsTrue' ? '<i class="fa fa-check"></i>' : '';
        return `
            <div class="col-sm-12 row questionOption">
                <div class="input-group ${cls}" style="align-items:center;">
                    <div class="input-group-prepend"><span class="input-group-text">${letter.toUpperCase()}</span></div>
                    <div class="input-group-append questionTable"><label style="margin-left:5px;">${text}</label>${checkIcon}</div>
                </div>
            </div>`;
    }

    function buildRevisionMcqHtml(q) {
        var analysis = q.StudentAnswerAnalysis || '';
        var statusLabel = '', statusColor = '';
        if (analysis === 'C') { statusLabel = 'Correct'; statusColor = '#00C024'; }
        else if (analysis === 'W') { statusLabel = 'Incorrect'; statusColor = '#FF0000'; }
        else if (analysis === 'S' || analysis === 'I') { statusLabel = 'Skipped'; statusColor = '#cb6009'; }

        var uddipok = q.UddipokText ? `<div class="uddipokText" style="display:block;">${q.UddipokText}</div>` : '';

        var options = buildRevisionOptionHtml('a', q.OptionA, q)
            + buildRevisionOptionHtml('b', q.OptionB, q)
            + buildRevisionOptionHtml('c', q.OptionC, q)
            + buildRevisionOptionHtml('d', q.OptionD, q)
            + (q.OptionE ? buildRevisionOptionHtml('e', q.OptionE, q) : '');

        var stats = '';
        if (q.HasStatistics) {
            var optEStats = q.OptionE ? `<div class="d-middle optionDiv mr-2"><h6 class="d-middle mb-0 mr-1">E</h6> ${q.TotalOptionEParticipatedPercent}%</div>` : '';
            stats = `
                <div class="row">
                    <div class="uniqueset-question-statistics d-flex justify-content-center align-items-center">
                        <div class="d-middle optionDiv mr-2"><h6 class="d-middle mb-0 mr-1">A</h6> ${q.TotalOptionAParticipatedPercent}%</div>
                        <div class="d-middle optionDiv mr-2"><h6 class="d-middle mb-0 mr-1">B</h6> ${q.TotalOptionBParticipatedPercent}%</div>
                        <div class="d-middle optionDiv mr-2"><h6 class="d-middle mb-0 mr-1">C</h6> ${q.TotalOptionCParticipatedPercent}%</div>
                        <div class="d-middle optionDiv mr-2"><h6 class="d-middle mb-0 mr-1">D</h6> ${q.TotalOptionDParticipatedPercent}%</div>
                        ${optEStats}
                        <div class="d-middle optionDiv"><h6 style="margin:0;padding:2px;border-radius:999px;background:#ffffff; color:#3F4651; width:75px;" class="d-middle optionDiv mr-1">Skipped</h6> ${q.TotalSkippedPercent}%</div>
                    </div>
                </div>`;
        }

        var solve = q.Solve ? `
            <div class="row solveText" style="display:block; padding:10px; color:#077307; overflow-x:auto; background-color:#d7f7d4;">
                <span style="color:black !important; font-weight:bold;">Solution:</span><br />
                <span style="color:black !important;">${q.Solve}</span>
            </div>` : '';

        return `
            <div class="row questionBlock" data-category="${statusLabel}">
                <div class="row question">
                    <div class="col-md-12" style="padding-left:0px; padding-right:0px;">
                        <div class="row">
                            <div class="serial">
                                <span>Question ${q.QuestionSerial}</span>
                                <span style="float:right !important; border-bottom:0px; color:${statusColor};">${statusLabel}</span>
                            </div>
                            ${uddipok}
                            <div class="questionText" style="display:block;">${q.QuestionText || ''}</div>
                        </div>
                    </div>
                    <div class="row questionOptions">${options}</div>
                    ${stats}
                    ${solve}
                </div>
            </div>`;
    }

    function buildRevisionWrittenHtml(q) {
        var sampleAns = q.SampleAnswer ? `
            <div class="row solveText" style="display:block; padding:10px; color:#077307; overflow-x:auto; background-color:#d7f7d4;">
                <span style="color:black !important; font-weight:bold;">Sample Answer:</span><br />
                <span style="color:black !important;">${q.SampleAnswer}</span>
            </div>` : '';

        return `
            <div class="row questionBlock">
                <div class="row question">
                    <div class="col-md-12" style="padding-left:0px; padding-right:0px;">
                        <div class="row">
                            <div class="serial"><span>Question ${q.QuestionSerial || ''}</span></div>
                            ${q.UddipokText ? `<div class="uddipokText" style="display:block;">${q.UddipokText}</div>` : ''}
                            <div class="questionText" style="display:block;">${q.QuestionText || ''}</div>
                        </div>
                    </div>
                    ${sampleAns}
                </div>
            </div>`;
    }

    function loadRevisionExam(isNext) {
        if (!_revisionNavParams) return;

        var requestDto = {
            ProgramId: _revisionNavParams.programId,
            SessionId: _revisionNavParams.sessionId,
            CourseId: _revisionNavParams.courseId,
            SubjectId: _revisionNavParams.subjectId,
            QuestionStatus: _revisionNavParams.questionStatus,
            IsForResume: true,
            IsNext: isNext,
            ExamId: _revisionCurrentExamId,
            IsFinished: false
        };

        $('#revisionNextBtn, #revisionPrevBtn, #revisionFinishBtn').prop('disabled', true);

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
                    if (isNext) { _revisionCurrentIndex++; } else { _revisionCurrentIndex--; }
                    _revisionNavParams.currentExamIndex = _revisionCurrentIndex;
                    renderRevisionContent(response, _revisionNavParams);
                    $('html, body').animate({ scrollTop: 0 }, 400);
                } else {
                    var msg = response && response.message ? response.message : 'Something went wrong';
                    showRevisionError(msg);
                    $('#revisionPrevBtn').prop('disabled', _revisionCurrentIndex <= 1);
                    var isLast = _revisionCurrentIndex >= _revisionNavParams.totalExamCount;
                    $('#revisionNextBtn').prop('disabled', isLast);
                    $('#revisionFinishBtn').prop('disabled', !isLast);
                }
            },
            error: function () {
                showRevisionError('Something went wrong');
                $('#revisionPrevBtn').prop('disabled', _revisionCurrentIndex <= 1);
                var isLast = _revisionCurrentIndex >= _revisionNavParams.totalExamCount;
                $('#revisionNextBtn').prop('disabled', isLast);
                $('#revisionFinishBtn').prop('disabled', !isLast);
            },
            complete: function () {
                $.unblockUI();
            }
        });
    }

    $(document).on('click', '#revisionNextBtn', function () { loadRevisionExam(true); });
    $(document).on('click', '#revisionPrevBtn', function () { loadRevisionExam(false); });

    $(document).on('click', '#revisionFinishBtn', function () {
        if (!_revisionNavParams) return;
        var $btn = $(this);
        $btn.prop('disabled', true).text('Finished');
        var requestDto = {
            ProgramId: _revisionNavParams.programId,
            SessionId: _revisionNavParams.sessionId,
            CourseId: _revisionNavParams.courseId,
            SubjectId: _revisionNavParams.subjectId,
            QuestionStatus: _revisionNavParams.questionStatus,
            IsForResume: true,
            IsNext: true,
            ExamId: _revisionCurrentExamId,
            IsFinished: true
        };
        $.ajax({
            url: '/Exam/RevisionExamQuestionAnswerInfo',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(requestDto),
            beforeSend: function () {
                $.blockUI({ timeout: 0, message: '<h1><img src="/Content/Image/ajax-loader.gif" /> Processing...</h1>' });
            },
            complete: function () {
                $.unblockUI();
                $('#revisionContent').hide();
                $('#performanceReportContent').show();
                $('html, body').animate({ scrollTop: 0 }, 400);
            }
        });
    });
