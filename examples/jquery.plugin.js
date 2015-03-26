(function($){
    $.fn.extend({
        test: function() {
            return 'Hello world';
        }
    });
}((typeof uoe==='object'&&uoe.$)||jQuery));
