# ngReactive #

> Try to keep as many of your components as possible stateless.
>
> --- <cite>[React Documentation](https://facebook.github.io/react/docs/interactivity-and-dynamic-uis.html)</cite>

ngReactive is a variant to the traditional ngReact which takes a slightly different approach to how you integrate React
components into your angular application.

The attractive nature of React is it's speed. So the glue you use to integrate React with your angular app should try
to be just that, a glue and not a bottle neck.

React recommends you should have one stateful component at the top of the hierarchy, with ngReactive the manipulation of
states are managed by your angular controller and the React components are left stateless. This along with a series of
micro-optimisations allow for faster, more efficient renders.

ngReactive auto-wraps functions passed as properties in angular $digests, and DOESN'T for renders. As such, all
communication from your React component back to your angular app should be done so through callbacks. Adhering to this
practice allows a reduction in unnecessary angular $digest cycles and allows for faster asynchronous rendering of
components.

### Usage ###

1. Include ngReactive as a dependency

```javascript
angular.module('myApp', [
        'react',
        'ngReactive'
    ]);
```

2. Create a directive for your React component

```javascript
let Test = React.createClass({
    displayName: 'Test',
    propTypes: {
        val: React.PropTypes.number,
        callback: React.PropTypes.func
    },
    click () {
        this.props.callback();
    },
    render: function () {
        return <div>
            <p onClick={this.click}>Val: {this.props.val}</p>
        </div>;
    }
});

angular.module("myApp")
    .directive("test", (ngReactive) => ngReactive(Test));
```

3. Awesome success

### API ###

ngReactive takes up to three arguments;

* reactComponent {ReactClass} The React component class
* params {Object} (Optional) Parameters to set on angular directive
* deepParse {Boolean=false} (Optional) When enabled replaces parameters passed to your React component with a lazy load
proxy that auto wraps any nested functions in a $digest cycle.