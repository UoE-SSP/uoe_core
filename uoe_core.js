/**
 * @package uoe_core
 * @url https://github.com/UoE-SSP/uoe_core
 */
(function( namespace ){
    "use strict";
    // Initiate the core object
    var core = {},
        isDOMReady = false, // Is the DOM complete?
        loadList = [], // Initiate the load queue
        loaded = [], // Initiate the load list
        dirPrefix = 'examples/'; // Change this to the location of your JavaScript files
    
    // Don't allow a conflict to happen
    if( !!window[namespace] ) return;
    
    // The grand resource matrix. You can use % as a synonym for the directory detailed above
    var resourceMatrix = {
        // Put your resource matrix here
        // See the README for more information on how to write this
        jquery2: {
            src: 'https://code.jquery.com/jquery-2.1.3.min.js',
            callback: function(){ core.$ = $.noConflict(); window.jQuery = $; }
        },
        demo: {
            depend: ['jquery2'],
            src: '%uoe_demo.js'
        }
    };
    
   /*****
    * ARBITRARY HELPERS
    *****/
    core.guid = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
    
   /*****
    * EVENTS
    *****/
    var events = {};
   /**
    * Allow people to subscribe to events
    * 
    * @param {string} event The name of the event to be attached to
    * @param {function} callback The function to be run on completion
    * @param {priority} boolean Whether the listener is high priority
    * @param {args} [object] Any additional arguments
    * @returns {object} The core object
    */
    core.on = function( event, callback, priority, args ) {
        
        var params = ( typeof args === 'object' && args.params ) ? args.params : [];
        
        // If it has already loaded, continue
        if( event.substr(0,5) === 'load:' && isLoaded( event.substr(5) ) ) {
            core.event_params = params;
            callback.apply( core );
            return core;
        }
        
        var obj = {
            callback: callback,
            params: params
        };
        
        // Add the event to the handler queue, pushing it to the start if asked
        if( typeof events[event] === 'object' ) {
            events[event][priority?'unshift':'push']( obj );
        } else {
            events[event] = [ obj ];
        }
        
        return core;
    }
    
   /**
    * Trigger an event
    *
    * @param {string} event The event to trigger
    * @param {array} [args] Arguments to apply to the subscribed callbacks
    * @returns {object} The core object
    */
    function trigger( event, args ) {
        if( typeof events[event] === 'undefined' ) {
            return true;
        }
        
        var cont = true;
        for( var i =0, l=events[event].length; i<l; i++ ) {
            var obj = events[event][i];
            core.event_params = obj.params;
            var result = obj.callback.apply( core, args );
            cont = cont && (typeof result==='boolean'?result:true);
            
            if( cont === false ) break;
        }
        return cont;
    }
    // Allow people to trigger events from outside
    core.trigger = trigger;
    
   /*****
    * SCRIPT LOADING
    *****/
   /**
    * Add a script to the load queue
    *
    * @param {string} resources Either the code of the object, or the URL of the file
    * @param {boolean} child Whether this is being loaded as a child of another resource
    * @returns {object} The core object
    */
    function loadIn( resources, child ) {
        if( typeof resources !== 'object' ) resources = [resources];
        // Add each script to the load list
        for( var i in resources ) {
            var resource = resourceMatrix[ resources[i] ];
            // If this is conditional, stick in an empty slot
            if( typeof resource === 'undefined' && resources[i].match(/\|/) ) {
                loadList.push({
                    code: resources[i],
                    condition: resources[i]
                });
            } else if( typeof resource !== 'undefined' && !isQueued( resources[i] ) && !isLoaded( resources[i] ) ) {
                // If this is already on the list, don't bother trying to add it
                resource.code = resources[i];
                // If there are any dependants, load them first
                if( resource.depend )
                    loadIn( resource.depend, true );
                resource.dependedOn = resource.dependedOn || child;
                loadList.push( resource );
            } else if( resources[i].substr(0,7) === 'http://' || resources[i].substr(0,8) === 'https://' ) {
                loadList.push({
                    code: resources[i],
                    src: resources[i],
                    dependedOn: child
                });
            } else if( typeof resource === 'undefined' ) {
                console.error( resources[i] + ' not found in the resource matrix.' );
            }
        }
        
        // Once the DOM is ready and this is top-level, start trying to load resources
        if( isDOMReady && !child ) {
            tryToLoadAll();
        }
        
        return core;
    }
    
   /**
    * Load a resource or group of resource
    * This is basically a public synonym for loadIn
    *
    * @see core.require
    * @param {string} resources Either the code of the object, or the URL of the file
    * @returns {object} The core object
    */
    core.load = function( subject ) {
        loadIn( subject, false );
        return core;
    }
    
   /**
    * Helper function to determine if a script is already in the queue
    *
    * @param {string} code The code of the resource to test
    * @returns {boolean} Whether the resource is queued
    */
    function isQueued( code ) {
        for( var i in loadList ) {
            if( loadList[i].code === code ) {
                return true;
            }
        }
        
        // If nothing was found, return false
        return false;
    }
    
   /**
    * Helper function to determine if a script is already loaded
    *
    * @param {string} code The code of the resource to test
    * @returns {boolean} Whether the resource is loaded
    */
    function isLoaded( code ) {
        if( !code ) return false;
        
        // If this is a conditional string (e.g. "jquery1|jquery2") check if *any* of those is loaded
        var codes = code.split('|');
        
        for( var t in codes ) {
            for( var i in loaded ) {
                if( loaded[i].code === codes[t] ) {
                    return true;
                }
            }
        }
                
        // If nothing was found, return false
        return false;
    }
    
   /**
    * Register a new module to the resource matrix
    * Note that this doesn't check if the name is already taken
    *
    * @param {string} code The code of the new resource
    * @param {object} resource The resource details
    * @returns {object} The core object
    */
    core.register = function( code, resource ) {
        resourceMatrix[code] = resource;
        return core;
    }
    
   /**
    * Load a resource or group of resource before performing a callback
    *
    * @param {string} files The code(s) of the resources to load
    * @param {function} callback The callback to perform when the files have loaded
    * @returns {object} The core object
    */
    core.require = function( files, callback ) {
        var requiredCount = 0;
        // Force to an array for easy iterating
        if( typeof files === 'string' ) files = [files];
        
        // The collector
        function collector() {
            requiredCount++;
            if( requiredCount === files.length ) {
                callback.apply( core );
            }
        }
        
        // Load each resource
        if( typeof callback === 'function' ) {
            for( var i in files ) {
                core.on( 'load:' + files[i], collector );
            }
        }
        
        // Go into core.load
        core.load( files, false );
        
        return core;
    }
    
   /**
    * Pre-inclusion checks on an object
    *
    * If it is a conditional include, work out which option is most suitable
    *
    * @param {string} obj The resource to check
    * @returns {object} The core object
    */
    function interpretScript( obj ) {
        if( obj.condition ) {
            var parts = obj.condition.split('|');
            var matchFound = false;
            
            for( var i in parts ) {
                if( isLoaded( parts[i] ) ) {
                    // If it's loaded, skip this whole step
                    obj = false;
                    matchFound = true;
                } else if( isQueued( parts[i] ) ) {
                    // If it's queued, clone it to load sooner
                    obj = resourceMatrix[ parts[i] ];
                    obj.code = parts[i];
                    matchFound = true;
                }
            }
            // If nothing suitable has been loaded, just use the first one in the list
            if( !matchFound ) {
                obj = resourceMatrix[ parts[0] ];
                obj.code = parts[0];
            }
        }
        
        // One final check we haven't done this before!
        if( isLoaded( obj.code ) ) {
            obj = false;
        }
        
        return obj;
    }
    
   /**
    * Parse an SRC URL. This does string subsitution for %
    *
    * @param {string} src The URL to parse
    * @returns {string} The pased URL
    */
    function parseSrc( src ) {
        // If it's of the form %filename.js, replace % with the prefix
        if( src.substr(0,1) === '%' ) {
            src = dirPrefix + src.substr(1);
        }
        return src;
    }
    
   /**
    * Insert a single script, along with any CSS dependencies and callbacks
    *
    * @param {object} obj The resource to include
    * @returns {object} The core object
    */
    function includeScript( obj ) {
        // First, check if there are any conditions to be fulfilled
        obj = interpretScript( obj );
        if( typeof obj === 'object' )
            obj.queued = true;
        // Update the load queue
        loadList[loadIndex] = obj;
        
        // One final check we haven't done this before!
        if( obj === false || document.querySelector('script[data-load-code="' + obj.code + '"]') ) {
            return true;
        }
        
        // Create the script
        var script = document.createElement('script');
        script.src = parseSrc( obj.src );
        script.type = 'text/javascript';
        // Set a code we can check against later
        script.setAttribute('data-load-code', obj.code );
        // Set async to true so we don't block other page load elements
        script.async = true;
        
        // Register any default callbacks to run when the script is loaded
        if( typeof obj.callback === 'function' ) {
            core.on( 'load:' + obj.code, obj.callback, true );
        }
        
        // Load in additional styles if suitable
        if( obj.style ) {
            includeStyle( obj );
        }
        
        // When the script has loaded, trigger the callbacks, and add it to the push list
        function onLoaded() {
            loaded.push( obj );
            trigger( 'load:' + obj.code );
            trigger( 'load' );
        }
        
        // Considered having a quick-include if nothing was dependent on the file but, depending on script
        // ordering and with conditionals, this is very hard to calculate.
        script.addEventListener('load', onLoaded, false);
        script.addEventListener('error', onLoaded, false);
        
        // Add to the <head> element
        document.getElementsByTagName('head')[0].appendChild( script );
        
        return core;
    }
    
   /**
    * Insert a single stylesheet
    *
    * @param {object} obj The resource to include the stylesheet from
    * @returns {object} The core object
    */
    function includeStyle( obj ) {
        var link = document.createElement('link');
        link.href = parseSrc( obj.style );
        // Set a code we can check against later
        link.setAttribute('data-load-code', obj.code );
        link.setAttribute('rel', 'stylesheet' );
        document.head.appendChild( link );
        
        return core;
    }
    
   /**
    * Try to include a single resource (hoping its dependencies are loaded)
    *
    * @param {object} obj The resource to include the stylesheet from
    * @returns {boolean} Whether the resource was successfully loaded
    */
    function tryToLoad( obj ) {
        // If it's already included, move on
        if( isLoaded( obj.code  ) ) {
            return true;
        }
        
        var depend = obj.depend;
        var i;
        
        if( typeof depend === 'string' ) depend = [depend];
        
        // Only continue if *all* the dependencies are loaded
        for( i in depend ) {
            if( !isLoaded( depend[i] ) ) {
                return false;
            }
        }

        // If it resolved this far, load the script in
        includeScript( obj );
        return true;
    }
    
   /**
    * Go through everything in the load queue and try to load everything that hasn't been loaded yet
    *
    * @returns {object} The core object
    */
    function tryToLoadAll() {
        // Run through everything in the "to load" list
        for( var i in loadList ) {
            var obj = loadList[i];
            
            // Anything that's loaded or queued can be skipped
            if( isLoaded( obj.code ) || obj.queued || typeof obj === 'boolean' ) {
                continue;
            }
            
            // Load the resource if it has no dependencies, or put it through tryToLoad,
            // which will check whether its criteria have been met.
            if( typeof obj.depend !== 'undefined' ) {
                tryToLoad( obj );
            } else {
                includeScript( obj );
            }
        }
        
        return core;
    }
    
    // Every time something is loaded, run tryToLoadAll again to see if there's anything else to push through
    core.on('load', tryToLoadAll);
    
    // We've queued up all the scripts in order. This index is used to track how far through the process we are.
    var loadIndex = 0;
    
    // The function to add the scripts to the page
    function loadScripts() {
        // The DOM is now ready
        isDOMReady = true;
        
        // Immediately try and load things
        tryToLoadAll();
    }
    
    // Load the scripts when the page has finished loading
    if( document.addEventListener ) {
        document.addEventListener( 'DOMContentLoaded', loadScripts, false );
    } else if( document.attachEvent ) {
        document.attachEvent( 'onDOMContentLoaded', loadScripts );
    }
    
    // Expose core to the global scope
    window[namespace] = core;
})( 'uoe' );