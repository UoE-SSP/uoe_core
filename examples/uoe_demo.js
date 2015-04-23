(function(core){
    "use strict";
 
    // Define namespace
    core.demo = {};
 
    // Require jQuery
    uoe.require('jquery2', function(){
        // Local-scope jQuery for easier writing
        var $ = core.$;

        // Define a function
        function writeText( str ) {
            $('#output').html( str );
        }
        
        // Expose to global scope
        core.demo.writeText = writeText;
        
        // A private function
        function updateTextFromInput() {
            writeText( 'Hello, ' +  ($('#input-box').val()||'[anonymous]') + '!' );
        }
        $('#input-box').keyup( updateTextFromInput );
        
        
        // Any other modules that are dependent on this can write to the
        // output using the globally available writeText function
        core.demo.writeText( 'Please type your name' );
    });
})(uoe);