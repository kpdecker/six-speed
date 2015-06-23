# six-speed

ES6 polyfill vs. feature performance tests.


## Usage

```
gulp test:sauce
```

Test against all registered Sauce Labs browsers.

```
gulp test:node
```

Tests against the current node version.

```
gulp server
```

Starts a server instance for manual browser testing. Tests may be accessed via `http://machineName:9999/` and the `#` component may be used to filter the tests to be executed, i.e. `http://machineName:9999/#promise`

```
gulp report
```

Generates the data report.
