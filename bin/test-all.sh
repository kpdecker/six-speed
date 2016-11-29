. ~/.nvm/nvm.sh

nvm install 4

rm -rf node_modules
yarn

mkdir browsers
rm -rf browsers/*.app browsers/*.dmg
./node_modules/.bin/browser-downloader browsers
if [ $? -ne 0 ]; then
  echo "Download failed";
  exit 1;
fi

devices=`hdiutil info | grep partition_scheme | awk '{print $1}'`
for x in $devices; do
  hdiutil detach $x
done

./node_modules/.bin/gulp test:local
./node_modules/.bin/gulp test:vm

./node_modules/.bin/gulp test:node

nvm install 5

rm -rf node_modules
yarn

./node_modules/.bin/gulp test:node

nvm install 6

rm -rf node_modules
yarn

./node_modules/.bin/gulp test:node
