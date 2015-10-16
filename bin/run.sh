rm nohup.out
nohup time ./bin/test-all.sh &

sleep 5
tail -f nohup.out
