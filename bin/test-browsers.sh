. ~/.nvm/nvm.sh

nvm use 4

rm -rf node_modules
yarn

./node_modules/.bin/gulp test:local
./node_modules/.bin/gulp test:vm
