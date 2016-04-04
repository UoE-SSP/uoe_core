# uoe_core

[![Build Status](https://travis-ci.org/UoE-SSP/uoe_core.svg?branch=master)](https://travis-ci.org/UoE-SSP/uoe_core)

This file forms the  bootstrapper for our JavaScript. All of our JavaScript files are loaded through uoe_core in the order specified by their dependencies.

**uoe_core is specifically designed for use with our implementation of SITS:Vision, and may not be suited to other applications. Equally, a lot of design decisions may seem unlikely but have been shaped by the environment we work in.**

## A note about completeness
This is our first pass at writing public documentation for the `uoe_core` object. If something appears to be missing, or is unclear, consider asking us through a GitHub issue first. We may have the answer, but neglecting to put it in this document.

## Example usage
Assuming you have all your dependencies set up correctly (see below), you can load up your application's JavaScript like so:
```html
    <script src="../uoe_core.js"></script>
    <script>uoe_core.load('demo');</script>
```

## Dependent modules

When writing a new module (either for a new set of functionality or for a specific application), it should exist in its own namespace, so that any variables or functions made public are stored under there.

For example, the "demo" module would produce an object at `uoe.demo` which contains all its public methods.

New modules should be built off the template provided below:
```javascript
(function(core){
    "use strict";

    // Define namespace
    core.namespace_for_this_mod = {};

    // Define a function
    function exampleFunctionIveCreated() {
        alert( 'Please remove the exampleFunctionIveCreated function from your module.' );
    }
    // Expose to global scope
    core.namespace_for_this_mod.exampleFunctionIveCreated = exampleFunctionIveCreated;

    // If using jQuery, wrap the parts of your code using it in a require.
    // You may end up wrapping your entire module in jQuery. That's fine.
    uoe.require('jquery2', function(){
        // Local-scope jQuery (so it's quicker to use)
        var $ = core.$;
    });
})(uoe);
```

There are several things of note in this template:

 - The code is all wrapped in a self-executing function so that it is separated from the global scope and can't interfere with it.
 - We locally scope the global root variable (we use `uoe`) to `core` inside the module. This makes it easier to share modules between different implementations of uoe_core.
 - We recommend using `"use strict";` to catch irresponsible code.
 - External modules like jQuery are included inline so that they are only loaded when necessary.
 - You can see the namespacing of the module in action.

## Working with jQuery

In SITS:Vision, a copy of jQuery is included in the page by default. However, due to the nature of how this is included, it is easy to run into problems where jQuery is not defined, or a local version is overwritten.

For this reason, we have chosen to add our own copy of jQuery into our `uoe` namespace (as `uoe.$`) so that there is no interference with the default version. This allows us to more strictly control the plugins added to jQuery and update to a new version if we want.

Because `uoe.$` is annoying to type repeatedly, we advise locally-scoping it to `$` in modules. This may seem like we're causing a crossover with the global `$` but as long as we keep it within the module, that won't happen. You can use any variable to local-scope and may prefer using, say, `u` or `λ`.

However, jQuery isn't a dependency of the uoe_core module in general. So if you don't want to use jQuery in lieu of another library (or not to use a library at all), it's very easy to change around.

### jQuery plugins
jQuery plugins attach themselves to the global `$` or `jQuery` object, so often end in lines like this:
```javascript
})( jQuery );
```
We simply change this line to:
```javascript
})( (typeof uoe==='object' && uoe.$) || jQuery );
```
This means that if the `uoe` object is defined and has jQuery attached then the plugin should attach itself to that. If the `uoe` object doesn't exist, the plugin will try and attach itself to a global jQuery object. This is important because it ensures that our plugins are backwards-compatible and still work with old applications.

## The Resource Matrix
All of the module dependencies are contained in the Resource Matrix at the top of the `uoe_core` file. The Matrix is a set of objects, all attached to unique codes that they are referenced by. In the base setup of `uoe_core` provided, you can see Resource Matrix entries for the `jquery` module. Note that the `demo` module doesn't have an entry here since its dependencies are loaded conditionally.

Each entry in the Resource Matrix can have the following properties:

 - `src` (required) - the URL of the file.
 - `callback` - a function to execute immediately after the file has been loaded (for example, this is used to namespace jQuery using its `noConflict` function.
 - `depend` - the codes of any dependencies of the module. This can either be supplied as an array, or as a string if there is only one dependency.
 - `style` - the URL of a CSS file that the module depends on. This should be used sparingly but is helpful, for example, for modules which are uncommonly used but require some additional styling.

If all your files are stored in one directory, or directory structure, you can also just use `uoe.require()` to load files directly from there without using the matrix. See the documentation for `uoe.require()` below for more information.

## Other core functions
As well as `load` demonstrated above, there are other functions provided with at the root level of `uoe_core`:

### uoe.guid()
Generates a [globally unique identifier](https://en.wikipedia.org/wiki/Globally_unique_identifier) as a string.

### uoe.on( str `event`, func `callback` )
Executes the function `callback` when the specified event occurs. There are some built-in events:
 - `load` is fired whenever any resource is loaded
 - `load:{resource_code}` is fired when the resource with code `{resource_code}` is loaded.

### uoe.trigger( str `event`, [ array `args` )
Fires the specified event, executing all listeners attached with `uoe.on`. The function is called in the context of the core uoe object and, if provided, the `args` array is used to form the arguments of the function.

### uoe.require( mixed `resources`, func `callback` )
Loads in the specified resource, including any dependencies it needs. You can also supply an array of resource codes to load in multiple resources

If a provided resource isn't in the matrix (either by defining it in the core file or using `uoe.register`), the page will automatically try and load the file found at `${dirPrefix}${resource}.js` where `${dirPrefix}` is the directory you define in the core file, and `${resource}` is the name of the resource you entered. If all of your JavaScript files are stored in one directory, this makes the matrix is unnecessary.

For example, if your `dirPrefix` is `https://www.ed.ac.uk/js/`, then you could use `uoe.require('modules/progression')` to load the file found at `https://www.ed.ac.uk/js/modules/progression.js`.

If you provide an empty string as the first argument, it will treated as "null script" and the callback function will immediately be run. This can be helpful when doing conditional loading.

If your JavaScript files output CommonJS modules, then the parameters of `callback` will be set to them. For example:
```javascript
uoe.require('commonjs.maths.js', function(maths) {
  maths.square(4); // Returns 16
});
```

### uoe.register( str `code`, obj `resource` )
Allows you to add a resource to the Resource Matrix, but at runtime. The format of `resource` and its available properties is as specified above.

## Renaming from "uoe"
We use the global namespace `uoe` because its our university's initials. You of course may want to change this. Doing so is not difficult. If, for example, you want to use `your_name_here` as the global namespace:

 - Change last line of `uoe_core.js` to `})( 'your_name_here' );`
 - In your modules, change the last line from `})(uoe);` to `})(your_name_here);`
 - In the function reference above use, for example, `your_name_here.require` instead of `uoe.require`.

If you *do* rename the object and come across any further advice, please advise on additional guidance we could provide by opening an issue or sending us a pull request.

## Contributing
Please use our [https://github.com/UoE-SSP/javascript-style-guide](https://github.com/UoE-SSP/javascript-style-guide) to format your JavaScript.