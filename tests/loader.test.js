function reloadScripts(done) {
    var d = document.querySelectorAll('script[data-load-code],script[src="/base/uoe_core.js"]');
    for (var i = 0, l = d.length; i < l ; i++) {
        d[i].parentNode.removeChild(d[i]);
    }

    uoe = null;

    // Load uoe_core
    var script = document.createElement('script');
    script.src = '/base/uoe_core.js';
    script.type = 'text/javascript';
    script.setAttribute('data-load-code', 'uoe_core');
    script.addEventListener('load', function() {
        done();
    });

    document.getElementsByTagName('head')[0].appendChild(script);
}

function registerJQuery() {
    uoe.register('jquery', {
        src: 'https://code.jquery.com/jquery-2.1.3.min.js',
        callback: function($) { this.$ = $.noConflict(); window.oldjQuery = $; }
    });
}

describe('uoe_core', function() {
    beforeEach(reloadScripts);

    it('should have an event system', function(done) {
        uoe.on('test', function(){
            done();
        });

        uoe.trigger('test');
    });

    it('should stop firing triggers if one returns false', function() {
        var shouldAlwaysBeTrue = true;
        uoe.on('test', function() { return false; });
        uoe.on('test', function() { shouldAlwaysBeTrue = false; });

        uoe.trigger('test');

        expect(shouldAlwaysBeTrue).toBe(true);
    });

    it('should load jQuery', function(done) {
        registerJQuery();

        uoe.require('jquery', function() {
            expect(typeof $).toEqual('undefined');
            expect(typeof uoe.$).toEqual('function');
            done();
        });
    });

    it('should load jQuery plugins', function(done) {
        registerJQuery();

        uoe.register('plugin', {
            depend: 'jquery',
            src: '/base/examples/jquery.plugin.js'
        });

        uoe.require('plugin', function() {
            expect(typeof uoe.$).toEqual('function');
            expect(typeof uoe.$.fn.test).toEqual('function');
            done();
        });
    });


    it('should load uoe modules', function(done) {
        registerJQuery();

        uoe.register('demo',{
            src: '/base/examples/uoe_demo.js'
        });

        uoe.require('demo', function() {
            expect(typeof uoe.demo).toEqual('object');

            // We have to wait until jQuery has been loaded before writeText will be available
            uoe.on('load:jquery2', function() {

                // We also have to use a setTimeout because uoe.demo defines the function in the same event loop
                setTimeout(function() {
                  expect(typeof uoe.demo.writeText).toEqual('function');
                  done();
                }, 1);
            });
        });
    });

    it('should load CommonJS modules', function(done) {
        registerJQuery();

        uoe.register('maths', {
            src: '/base/examples/commonjs.maths.js'
        });

        uoe.require('maths', function(maths) {
            expect(typeof maths).toEqual('object');
            expect(typeof maths.square).toEqual('function');
            expect(maths.square(4)).toEqual(16);
            done();
        });
    });

    it('should load explicitly defined modules', function(done) {
        uoe.require('%commonjs.maths.js', function(maths) {
            expect(maths.square(4)).toEqual(16);
            done();
        });
    });

    it('should optimistically load unknown modules', function(done) {
        uoe.require('commonjs.maths', function(maths) {
            expect(maths.square(4)).toEqual(16);
            done();
        });
    });

    it('should set attributes on the script if asked', function(done) {
        uoe.register('maths', {
            src: '/base/examples/commonjs.maths.js',
            attrs: { 'data-test': 'value' }
        });

        uoe.require('maths', function(maths) {
            expect(document.querySelector('[data-load-code="maths"]').getAttribute('data-test')).toEqual('value');
            done();
        });
    });

    it('should not let you load two versions of core on the same page', function(done) {
        // Create an identifier
        var id = uoe.guid();
        uoe.instance_id = id;

        // Load another copy of the core file and check it hasn't overwritten the uoe object
        uoe.register('core', { src: '/base/uoe_core.js' });
        uoe.require('core', function() {
            expect(uoe.instance_id).toEqual(id);
            done();
        });
    });

    it('should "load" null scripts', function(done) {
        uoe.require('', function() {
            done();
        });
    });

    it('should load files conditionally', function(done) {
        registerJQuery();

        uoe.register('jquery-google-cdn', {
            src: 'https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js'
        });

        uoe.register('bootstrap', {
            src: 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js',
            depend: 'jquery|jquery-google-cdn'
        });

        uoe.require('bootstrap', function() {
            expect(typeof uoe.$).toEqual('function');
            done();
        });
    });

    it('should fire load events after-the-fact', function(done) {
        registerJQuery();

        uoe.require('jquery', function() {
            // Give some time to ensure its completely loaded in
            setTimeout(function() {
                uoe.on('load:jquery', function() {
                    done();
                });
            }, 500);
        });
    });

    it('should use load stylesheets too', function(done) {
        uoe.register('uoe_demo_css', {
            src: '/base/examples/uoe_demo.js',
            style: '/base/examples/uoe_demo.css'
        });

        uoe.require(['jquery2', 'uoe_demo_css'], function() {
            expect(window.getComputedStyle(document.body).backgroundColor).toEqual('rgb(255, 0, 0)');
            done();
        });
    });

    it('should use `load` as a synonym for `require`', function(done) {
        uoe.register('demo',{
            src: '/base/examples/uoe_demo.js'
        });

        uoe.on('load:demo', function() {
            done();
        });

        uoe.load('demo');
    });
});