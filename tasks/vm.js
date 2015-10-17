var ChildProcess = require('child_process'),
    Gulp = require('gulp'),
    Server = require('./server');

var RUN_USER = 'vmrun -gu IEUser -gp Passw0rd! ';

Gulp.task('test:vm', ['build:browser', 'test:vm:edge', 'test:vm:ie']);

Gulp.task('test:vm:edge', ['build:browser'], function(callback) {
  runVM(runEdge, callback);
});
Gulp.task('test:vm:ie', ['build:browser', 'test:vm:edge'], function(callback) {
  runVM(runIE, callback);
});


function runVM(run, callback) {
  var vmx = './browsers/MsEdge-Win10-VMware.vmwarevm';
  Server.start(function(uri) {
    startVM(vmx)
        .then(function() { return setExperimental(vmx); })
        .then(function() { return run(vmx, uri); })
        .catch(cleanup);
  }, function() {
    cleanup();
  });

  function cleanup() {
    // Kill the vm
    stopVM(vmx)
      .then(function() {
        Server.stop(function() {
          callback();
        });
      });
  }
}

function startVM(vmx) {
  return run('vmrun start "' + vmx + '"')
      // Introduce our own arbitrary wait as the Win10 VM seems to have issues when sending
      // VMTools commands immediately after the first startup.
      .then(function() {
        return new Promise(function(resolve) {
          // After it says we've started, put in a nice long timeout to allow the VM tools to startup
          // There appears to be some sort of hang that occurs if we do this too soon in the process.
          setTimeout(function() {
            resolve(vmx);
          }, 60 * 1000);
        });
      });
}

function setExperimental(vmx) {
  // Enable Edge experimental features
  var key = 'HKCU\\SOFTWARE\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppContainer\\Storage\\microsoft.microsoftedge_8wekyb3d8bbwe\\MicrosoftEdge\\ExperimentalFeatures';
  return run(RUN_USER + 'runProgramInGuest "' + vmx + '" "C:\\Windows\\System32\\reg.exe" ADD "' + key + '" /v ExperimentalJS /t REG_DWORD /d 1 /f');
}
function runEdge(vmx, uri) {
  return run(RUN_USER + 'runProgramInGuest "' + vmx + '" -interactive -activeWindow  "C:\\Windows\\explorer.exe" microsoft-edge:' + uri + '/?tag=prerelease');
}
function runIE(vmx, uri) {
  return run(RUN_USER + 'runScriptInGuest "' + vmx + '" -interactive -activeWindow -noWait "" "\\"C:\\Program Files\\Internet Explorer\\iexplore.exe\\" ' + uri + '/?tag=stable"');
}
function stopVM(vmx) {
  return run('vmrun stop "' + vmx + '" hard');
}

function run(command, options, counter) {
  counter = counter || 0;

  return new Promise(function(resolve, reject) {
    console.log('run', command);
    ChildProcess.exec(command, options, function(err, stdout, stderr) {
      if (counter < 5
          && (/The specified guest user must be logged in interactively to perform this operation/.test(stdout)
            || (/The VMware Tools are not running in the virtual machine/).test(stdout)
            || nonZero(/reg.exe/, command, stdout))) {
        // Allow retries if there is something that might be waiting for background processes like updates
        counter++;
        console.log('retry', counter, command);
        setTimeout(function() {
          resolve(run(command, options, counter));
        }, 10 * 1000 * counter);

        return;
      }

      /* istanbul ignore if */
      if (err
          && !(/The virtual machine is not powered on/.test(stdout))
          && !(/The virtual machine cannot be found/.test(stdout))

          // Complete hack, but we want to ignore explorer error codes as they
          // occur when the command actually completed.
          && !nonZero(/explorer.exe/, command, stdout)
          && !nonZero(/taskkill/, command, stdout)) {
        console.log(err, stdout, stderr);
        reject(err);
      } else {
        setTimeout(function() {
          resolve(stdout);
        }, 5000);
      }
    });
  });
}

function nonZero(exe, command, stdout) {
  return (/Guest program exited with non-zero exit code/).test(stdout)
      && (exe).test(command);
}
