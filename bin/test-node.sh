. ~/.nvm/nvm.sh

nvm use 6
rm -rf node_modules
yarn
./node_modules/.bin/gulp test:node

nvm use 7
rm -rf node_modules
yarn
./node_modules/.bin/gulp test:node
