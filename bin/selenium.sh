JAR_FILE=./bin/selenium-server-standalone-2.45.0.jar
CHROME_DRIVER=./bin/chromedriver

java \
    -Dwebdriver.chrome.driver=$CHROME_DRIVER \
    -DSafariDefaultPath=/Applications/WebKit.app/Contents/MacOS/WebKit \
    -Dwebdriver.firefox.bin=/Applications/FirefoxNightly.app/Contents/MacOS/firefox-bin \
    -jar $JAR_FILE
