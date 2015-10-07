. ~/.nvm/nvm.sh
killall sc

nvm install 4

rm -rf node_modules
npm install

rm -rf browsers
mkdir browsers
./node_modules/.bin/browser-downloader browsers

./node_modules/.bin/gulp build

./node_modules/.bin/gulp test:local
./node_modules/.bin/gulp test:sauce

./node_modules/.bin/gulp test:node

nvm install 0.12

rm -rf node_modules
npm install

./node_modules/.bin/gulp test:node
