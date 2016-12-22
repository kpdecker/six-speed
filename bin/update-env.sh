. ~/.nvm/nvm.sh

nvm install 6
npm install -g yarn
yarn

mkdir ~/browsers
rm -rf ~.browsers/*.app browsers/*.dmg ~.browsers/*.app browsers/*.dmg.etag
./node_modules/.bin/browser-downloader ~/browsers
if [ $? -ne 0 ]; then
  echo "Download failed";
  exit 1;
fi

devices=`hdiutil info | grep partition_scheme | awk '{print $1}'`
for x in $devices; do
  hdiutil detach $x
done

nvm install 7
npm install -g yarn

nvm install 4
npm install -g yarn

