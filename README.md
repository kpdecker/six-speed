# six-speed

ES6 polyfill vs. feature performance tests.

Report is located at http://kpdecker.github.io/six-speed/


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


## Thanks

Thanks to [BrowserStack](browserstack.com) and [Sauce Labs](https://saucelabs.com/) for providing open source accounts which the majority of this testing was performed on.
