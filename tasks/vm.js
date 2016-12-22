var ChildProcess = require('child_process'),
    Gulp = require('gulp'),
    GUtil = require('gulp-util'),
    Server = require('./server'),
    userhome = require('user-home');

var RUN_USER = 'vmrun -gu IEUser -gp Passw0rd! ';

Gulp.task('test:vm', ['build:browser', 'test:vm:edge']);

Gulp.task('test:vm:edge', ['build:browser'], function(callback) {
  runVM('stable', runEdge, (err) => {
    if (err) {
      return callback(err);
    }

    runVM('preview', runEdge, callback);
  });
});


function runVM(branch, run, callback) {
  var vmx = `${userhome}/browsers/edge/${branch}/MSEdge - Win10_preview.vmx`,
      tag = branch === 'preview' ? '/?tag=prerelease' : '';
  Server.start(function(uri) {
    loadSnapshot(vmx)
        .then(() => startVM(vmx))
        .then(() => setExperimental(vmx))
        .then(() => run(vmx, `${uri}${tag}`))
        .catch(cleanup);
  }, function() {
    cleanup();
  });

  function cleanup(err) {
    // Kill the vm
    stopVM(vmx)
      .catch(() => {})
      .then(function() {
        Server.stop(function() {
          callback(err);
        });
      });
  }
}

// Some of this sourced from the excellent https://gist.github.com/neovov/5372144
function startVM(vmx) {
  return run('vmrun start "' + vmx + '"')
      .then(delay(10));
}

function delay(seconds) {
  return function() {
    return new Promise(function(resolve) {
      setTimeout(function() {
        resolve();
      }, seconds * 1000);
    });
  };
}

function loadSnapshot(vmx) {
  return run('vmrun listSnapshots "' + vmx + '"')
      .then(function(snapshots) {
        if (!/six-speed/.test(snapshots)) {
          return Promise.reject(new Error('No six-speed snapshot in VM, please setup per README'));
        }

        return run('vmrun revertToSnapshot "' + vmx + '" six-speed');
      });
}

function setExperimental(vmx) {
  // Enable Edge experimental features
  var key = 'HKCU\\SOFTWARE\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\CurrentVersion\\AppContainer\\Storage\\microsoft.microsoftedge_8wekyb3d8bbwe\\MicrosoftEdge\\ExperimentalFeatures';
  return run(RUN_USER + 'runProgramInGuest "' + vmx + '" "C:\\Windows\\System32\\reg.exe" ADD "' + key + '" /v ExperimentalJS /t REG_DWORD /d 1 /f');
}
function runEdge(vmx, uri) {
  return run(RUN_USER + 'runProgramInGuest "' + vmx + '" -interactive -activeWindow  "C:\\Windows\\explorer.exe" microsoft-edge:' + uri);
}
function stopVM(vmx) {
  return run('vmrun stop "' + vmx + '" hard');
}

function run(command, options, counter) {
  counter = counter || 0;

  return new Promise(function(resolve, reject) {
    GUtil.log('[vm]', 'run', command);
    ChildProcess.exec(command, options, function(err, stdout, stderr) {
      if (counter < 5
          && (/The specified guest user must be logged in interactively to perform this operation/.test(stdout)
            || (/The VMware Tools are not running in the virtual machine/).test(stdout)
            || nonZero(/reg.exe/, command, stdout))) {
        // Allow retries if there is something that might be waiting for background processes like updates
        counter++;
        GUtil.log('[vm]', 'retry', counter, command);
        setTimeout(function() {
          resolve(run(command, options, counter));
        }, 10 * 1000 * counter);

        return;
      }

      /* istanbul ignore if */
      if (err
          && !(/The virtual machine is not powered on/.test(stdout))

          // Complete hack, but we want to ignore explorer error codes as they
          // occur when the command actually completed.
          && !nonZero(/explorer.exe/, command, stdout)
          && !nonZero(/taskkill/, command, stdout)) {
        GUtil.log('[vm]', err, stdout, stderr);
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
