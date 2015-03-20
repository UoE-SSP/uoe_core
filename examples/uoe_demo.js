(function(uoe){
    "use strict";
 
    // Local-scope jQuery (if you're using it)
    var $ = uoe.$;
 
    // Define namespace
    uoe.demo = {};

    // Define a function
    function writeText( str ) {
        $('#output').html( str );
    }
    
    // Expose to global scope
    uoe.demo.writeText = writeText;
    
    // A private function
    function updateTextFromInput() {
        writeText( 'Hello, ' +  ($('#input-box').val()||'[anonymous]') + '!' );
    }
    $('#input-box').keyup( updateTextFromInput );
    
    
    // Any other modules that are dependent on this can write to the
    // output using the globally available writeText function
    uoe.demo.writeText( 'Please type your name' );
})(uoe);