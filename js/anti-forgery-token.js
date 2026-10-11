
        var antyForgery = "";
        function gettoken() {
            var token = '<input name="__RequestVerificationToken" type="hidden" value="CfDJ8N35IQ6GAvpBvtp9ntZwaHXPtuOW69pmny1HeFu0H37f5J1RH6wP7wyjha1fS4EXDluZFSF-NOBSz_kdvQZ5K7Q4Ds_9k3wh9USEkNCiAlLSKsP1WtahWihEYhWZafqJY6_8lyJwz6OwmfU56dOqf0JJJnoncGLKFHca4MjedzkXYvTrJfNZah5iDeyAk5LQSg" />';
            token = $(token).val();
            return token;
        }
    