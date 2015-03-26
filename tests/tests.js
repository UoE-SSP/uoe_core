// Check the on/trigger event system works
QUnit.test( "Event system", function( assert ) {
    var done = assert.async();
    
    uoe.on('test', function(){
        assert.ok( 1, "Event fired" );
        done();
    });
    
    uoe.trigger( 'test' );
});

// Check the jQuery is properly loaded into the uoe object
QUnit.test( "jQuery noConflict", function( assert ) {
    var done = assert.async();
    
    uoe.register('jquery',{
        src: 'https://code.jquery.com/jquery-2.1.3.min.js',
        callback: function() { this.$ = $.noConflict(); window.jQuery = $; }
    });
    
    uoe.require('jquery', function() {
        assert.ok( typeof uoe.$ === 'function', "jQuery exists in object" );
        assert.ok( typeof $ === 'undefined', "jQuery doesn't exist in global scope" );
        done();
    });
});

// Check that jQuery plugins attach properly
QUnit.test( "jQuery plugins", function( assert ) {
    var done = assert.async();
    
    uoe.register('plugin', {
        depend: 'jquery',
        src: '../examples/jquery.plugin.js'
    });
    
    uoe.require('plugin', function() {
        assert.ok( typeof uoe.$ === 'function', "jQuery loaded" );
        assert.ok( typeof uoe.$.fn.test === 'function', "Plugin loaded" );
        done();
    });
});

// Check you can't load two versions of core on the same page
QUnit.test( "uoe_core conflict aversion", function( assert ) {
    var done = assert.async();
    
    // Create an identifier
    var id = uoe.guid();
    uoe.instance_id = id;
    
    // Load another copy of the core file and check it hasn't overwritten the uoe object
    uoe.register('core', { src: '../uoe_core.js' });
    uoe.require('core', function() {
        assert.ok( uoe.instance_id === id, "Conflict averted" );
        done();
    });
});