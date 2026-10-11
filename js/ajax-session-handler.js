
    $(document).ajaxComplete(function (xhr, status) {
        if (status.getResponseHeader("X-Responded-JSON") != null) {
            var obj = jQuery.parseJSON(status.getResponseHeader("X-Responded-JSON"));
            if (obj.status == 401) {
                //window.location.assign(obj.headers['location']);
                window.location.assign(obj.headers['location'].substr(0, obj.headers['location'].indexOf('?')));
            }
        }
    });

    function mobileCheck(mobileNumber) {
        mobileNumber = mobileNumber.replace(/\W+/g, "");
        var chkVal = mobileNumber.match(/^(?:\+?88)?0?1[13-9]\d{8}$/);
        if (chkVal != null) {
            if (mobileNumber.length == 11) {
                chkVal = '88' + chkVal;
            }
            else if (mobileNumber.length == 10) {
                chkVal = '880' + chkVal;
            }
            var chkVal = mobileNumber.match(/^(?:\+?88)?01[13-9]\d{8}$/);
            if (chkVal != null) {
                if (mobileNumber.length == 11) {
                    chkVal = '88' + chkVal;
                }
                else if (mobileNumber.length == 10) {
                    chkVal = '880' + chkVal;
                }
            }
            //alert(chkVal);
        }
        return chkVal;
    }

    function nickNameCheck(nickName) {
        var chkVal = nickName.match(/^[a-zA-Z .-`]$/);
        return chkVal;
    }

    //This function is used for remove other char without numeric for text field
    function isNumber(evt) {
        evt = (evt) ? evt : window.event;
        var charCode = (evt.which) ? evt.which : evt.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    function showErrorMessageBelowCtrl(ctrlId, message, show) {

        var divHtml = '<div style="color:red;" id="' + ctrlId + '_err_div" >' + message + '</div>';

        if (show == true) {
            $('#' + ctrlId).addClass("highlight");
            $('#' + ctrlId).after(divHtml);
        } else {
            $('#' + ctrlId).removeClass("highlight");
            $('#' + ctrlId + '_err_div').remove();
        }
    }

    function validateTextField(controlId, errorMessage) {

        $(document).on("input propertychange", "#" + controlId, function (event) {

            var value = $("#" + controlId).val().trim();

            if (value.length == 0) {
                showErrorMessageBelowCtrl(controlId, "", false);
                showErrorMessageBelowCtrl(controlId, errorMessage, true);
                return false;
            } else {
                showErrorMessageBelowCtrl(controlId, "", false);
            }
        });
    }

    function validateDropDownField(controlId, targetId, errorMessage) {

        $(document).on("change", "#" + controlId, function (event) {

            var val = $("#" + targetId).val();
            if (val.length == 0) {
                //showErrorMessageBelowCtrl(controlId, "", false);
                showErrorMessageBelowCtrl(controlId, errorMessage, true);
            } else {
                showErrorMessageBelowCtrl(controlId, "", false);
            }
        });
    }

    function validateDropDownField(controlId, errorMessage) {

        $(document).on("change", "#" + controlId, function (event) {

            var val = $("#" + controlId).val();
            if (val.length == 0) {
                showErrorMessageBelowCtrl(controlId, "", false);
                showErrorMessageBelowCtrl(controlId, errorMessage, true);
            } else {
                showErrorMessageBelowCtrl(controlId, "", false);
            }
        });
    }

    function validateListField(controlId, errorMessage) {

        $(document).on("change", "#" + controlId, function (event) {
            var val = $("#" + controlId).val();
            if (val == null || val.length == 0) {
                showErrorMessageBelowCtrl(controlId, "", false);
                showErrorMessageBelowCtrl(controlId, errorMessage, true);
            } else {
                showErrorMessageBelowCtrl(controlId, "", false);
            }
        });
    }

    function scrollToElement(selector) {
        var s = $(selector);
        if (s != undefined)
            $(document.body).scrollTop($(selector).offset().top - 120);
    }

    $(document).ready(function () {

        $("select").change(function () {
            if ($(this).val() != "") {
                $(this).parent().find(".field-validation-error-count").remove();
                $(this).next('span').empty();
            }

            else {
                //$(this).parent().find(".field-validation-error-count").remove();
                $(this).parent().remove("span");
                $(this).parent().append("<span class='text-danger field-validation-error' style='color:red'></span>");
            }
        });

        $(document).on("input propertychange", ".numbersOnly", function (event) {
            var valStr = $(this).val();
            var id = $(this).attr("id");
            var val = parseInt(valStr);
            showErrorMessageBelowCtrl(id, "", false);
            if (isNaN(val)) {
                $(this).val("");
            }
            else if (val < 0) {
                $(this).val("");
                showErrorMessageBelowCtrl(id, "Please enter valid amount", true);
            } else {
                $(this).val(val);
            }
        });
    });
