
        $(document).ready(function () {
            $('#liveClassCollapse, #liveExamCollapse').on('show.bs.collapse', function () {

                var current = this;

                // 1. Clicked section icon rotation
                var $currentArrow = $('[data-target-arrow="' + current.id + '"] i');
                $currentArrow.removeClass('fa-chevron-down').addClass('fa-chevron-up');

                // 2. Others section collapse
                $('#liveClassCollapse, #liveExamCollapse')
                    .not(current)
                    .collapse('hide');

            }).on('hidden.bs.collapse', function () {

                // 3. Others section icon rotation
                var $arrow = $('[data-target-arrow="' + this.id + '"] i');
                $arrow.removeClass('fa-chevron-up').addClass('fa-chevron-down');

            }).on('shown.bs.collapse', function () {

                var current = this;

                // 4. Scroll to expanded section top
                $('html, body').animate({
                    scrollTop: $(current).offset().top - 150
                }, 100);

            });
        });

        // Board Info popups queue one after another (e.g. SSC then HSC), driven by the server-decided exam list
        var boardInfoExamQueue = [];
        var boardInfoQueueIndex = -1;

        function showNextBoardInfoModal() {
            boardInfoQueueIndex++;
            if ($('#boardInfoModal').length == 0 || boardInfoQueueIndex >= boardInfoExamQueue.length) {
                return;
            }
            var exam = boardInfoExamQueue[boardInfoQueueIndex];
            $('#boardInfoStudentExamId').val(exam.studentExamId);
            if (exam.wasPreviouslyIncorrect) {
                $('#boardInfoTitle').text('The ' + exam.examName + ' information you provided previously was incorrect! Please submit your correct ' + exam.examName + ' board information');
            } else {
                $('#boardInfoTitle').text('Please submit your ' + exam.examName + ' board information');
            }
            $('#boardInfoYear').val('');
            $('#boardInfoBoard').val('');
            $('#boardInfoBoardRoll').val('');
            $('#boardInfoRegistrationNo').val('');
            $('#boardInfoError').hide();
            $('#boardInfoSuccess').hide();
            $('#boardInfoYearError, #boardInfoBoardError, #boardInfoBoardRollError, #boardInfoRegistrationNoError').hide();
            updateBoardInfoSubmitButtonState();
            $('#boardInfoModal').modal('show');
        }

        // Show Facebook Group popup on page load (server already decided it should show);
        // if it isn't rendered, start the Board Info popup queue directly instead
        $(document).ready(function () {
            if ($('#facebookGroupModal').length) {
                $('#facebookGroupModal').modal('show');
            } else {
                showNextBoardInfoModal();
            }
        });

        // When FB group modal closes, set cookie so popup won't show again until cookie expires,
        // then start the Board Info popup queue (if any)
        $('#facebookGroupModal').on('hidden.bs.modal', function () {
            $.ajax({
                url: '/Dashboard/JoinFacebookGroup',
                type: 'POST',
                data: { __RequestVerificationToken: gettoken() }
            });
            showNextBoardInfoModal();
        });

        // Whenever a Board Info popup closes (submitted or skipped via X), show the next queued exam, if any
        $('#boardInfoModal').on('hidden.bs.modal', function () {
            showNextBoardInfoModal();
        });

        // Keep Submit disabled until every field has a value
        function updateBoardInfoSubmitButtonState() {
            var allFilled = $('#boardInfoYear').val()
                && $('#boardInfoBoard').val()
                && $.trim($('#boardInfoBoardRoll').val())
                && $.trim($('#boardInfoRegistrationNo').val());
            $('#boardInfoSubmitBtn').prop('disabled', !allFilled);
        }

        $(document).on('input', '#boardInfoBoardRoll, #boardInfoRegistrationNo', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        $(document).on('change', '#boardInfoYear, #boardInfoBoard', updateBoardInfoSubmitButtonState);
        $(document).on('input', '#boardInfoBoardRoll, #boardInfoRegistrationNo', updateBoardInfoSubmitButtonState);

        $(document).on('change', '#boardInfoYear', function () { $('#boardInfoYearError').hide(); });
        $(document).on('change', '#boardInfoBoard', function () { $('#boardInfoBoardError').hide(); });
        $(document).on('input', '#boardInfoBoardRoll', function () { $('#boardInfoBoardRollError').hide(); });
        $(document).on('input', '#boardInfoRegistrationNo', function () { $('#boardInfoRegistrationNoError').hide(); });

        $(document).on('click', '#boardInfoSubmitBtn', function () {
            var $btn = $(this);
            var year = $('#boardInfoYear').val();
            var boardId = $('#boardInfoBoard').val();
            var boardRoll = $.trim($('#boardInfoBoardRoll').val());
            var registrationNo = $.trim($('#boardInfoRegistrationNo').val());
            var boardRollPattern = /^[0-9]{6}$/;
            var registrationNoPattern = /^[0-9]{10}$/;

            $('#boardInfoError').hide();
            $('#boardInfoYearError, #boardInfoBoardError, #boardInfoBoardRollError, #boardInfoRegistrationNoError').hide();

            var hasError = false;
            if (!year) { $('#boardInfoYearError').text('Please select year.').show(); hasError = true; }
            if (!boardId) { $('#boardInfoBoardError').text('Please select board.').show(); hasError = true; }
            if (!boardRollPattern.test(boardRoll)) { $('#boardInfoBoardRollError').text('Board Roll must be 6 digits.').show(); hasError = true; }
            if (!registrationNoPattern.test(registrationNo)) { $('#boardInfoRegistrationNoError').text('Registration No. must be 10 digits.').show(); hasError = true; }

            if (hasError) return;

            $btn.prop('disabled', true);
            $.ajax({
                url: '/Dashboard/SaveBoardInfo',
                type: 'POST',
                data: {
                    StudentExamId: $('#boardInfoStudentExamId').val(),
                    Year: year,
                    BoardId: boardId,
                    BoardRoll: boardRoll,
                    RegistrationNo: registrationNo,
                    __RequestVerificationToken: gettoken()
                },
                success: function (response) {
                    if (response.isSuccess) {
                        $('#boardInfoError').hide();
                        $('#boardInfoSuccess').show();
                        setTimeout(function () {
                            $('#boardInfoModal').modal('hide');
                        }, 1000);
                    } else {
                        $('#boardInfoError').text(response.message || 'Something went wrong.').show();
                    }
                },
                error: function () {
                    $('#boardInfoError').text('Something went wrong.').show();
                },
                complete: function () {
                    updateBoardInfoSubmitButtonState();
                }
            });
        });

        $(document).on('click', '.app-btn-take-exam', function () {
            setCookie("AppExamReturnUrl", "/Dashboard/NewDashBoard", 1);
        });
    