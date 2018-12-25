ROOTURL=http://localhost:3001
echo $ROOTURL
curl -X POST --header "Content-Type: application/json" -d '{"amount": 20, "sender": "bill", "recipient": "jill"}' $ROOTURL/transaction 
curl $ROOTURL/blockchain | jq
curl -XPOST $ROOTURL/mine | jq

#registering nodes
#npm run node_1
echo {} | jq -c ".newNodeUrl = \"$ROOTURL\"" | xsel -b
echo $ROOTURL
curl -X POST --header "Content-Type: application/json" -d '{"newNodeUrl":"http://localhost:3002"}' $ROOTURL/register-node
curl $ROOTURL/blockchain | jq '.networkNodes'

curl -X POST $ROOTURL/register-nodes-bulk -H "Content-Type: application/json" -d @- <<EOF
{
    "allNetworkNodes": [
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004"
    ]
}
EOF

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:3001/register-and-broadcast-node <<EOF
{"newNodeUrl": "http://localhost:3002"}
EOF

curl http://localhost:3001/blockchain | jq
curl http://localhost:3002/blockchain | jq

netstat --listening --programs | grep :300 | awk '{print $7}' | cut -d'/' -f1 | xargs -n 1 kill

curl -X POST -H "Content-Type: application/json" -d @- http://localhost:3001/register-and-broadcast-node <<EOF
{"newNodeUrl": "http://localhost:3003"}
EOF

curl http://localhost:3001/blockchain | jq

./node_modules/mocha/bin/mocha dev/
./node_modules/mocha/bin/mocha dev/promise-test.js
./node_modules/mocha/bin/mocha dev/test-nodes.js

./node_modules/cucumber/bin/cucumber-js features/ -r steps/

for n in {1..5}
do 
    curl http://localhost:300$n/blockchain | jq
    sleep 1
done

curl -X POST -H 'Content-Type: application/json' -d @- http://localhost:3001/transaction <<EOF
{
    "amount": 100,
    "sender": "NNFANSDFHYHTN90A09SNFAS",
    "recipient": "IU99N0A90WENNU234UFAW"
}
EOF

curl http://localhost:3001/blockchain | jq '.pendingTransactions' 

###############

curl -H "Content-Type: application/json" -X POST -d @- http://localhost:3001/register-and-broadcast-node <<EOF
{"newNodeUrl": "http://localhost:3002"}
EOF
curl -H "Content-Type: application/json" -X POST -d @- http://localhost:3001/register-and-broadcast-node <<EOF
{"newNodeUrl": "http://localhost:3003"}
EOF
curl -H "Content-Type: application/json" -X POST -d @- http://localhost:3001/register-and-broadcast-node <<EOF
{"newNodeUrl": "http://localhost:3004"}
EOF

curl http://localhost:3001/blockchain | jq '.networkNodes[]'

curl -X POST -H 'Content-Type: application/json' -d @- http://localhost:3001/transaction/broadcast <<EOF
{
    "amount": 100,
    "sender": "NNFANSDFHYHTN90A09SNFAS",
    "recipient": "IU99N0A90WENNU234UFAW"
}
EOF

curl http://localhost:3001/blockchain | jq '.pendingTransactions[]'
curl http://localhost:3002/blockchain | jq '.pendingTransactions[]'
curl http://localhost:3003/blockchain | jq '.pendingTransactions[]'


curl -H "Content-Type: application/json" -X POST -d @- http://localhost:3001/register-and-broadcast-node <<EOF
{"newNodeUrl": "http://localhost:3002"}
EOF
curl -H "Content-Type: application/json" -X POST -d @- http://localhost:3001/register-and-broadcast-node <<EOF
{"newNodeUrl": "http://localhost:3003"}
EOF
curl -H "Content-Type: application/json" -X POST -d @- http://localhost:3001/register-and-broadcast-node <<EOF
{"newNodeUrl": "http://localhost:3004"}
EOF
curl -H "Content-Type: application/json" -X POST -d @- http://localhost:3001/register-and-broadcast-node <<EOF
{"newNodeUrl": "http://localhost:3005"}
EOF
curl -X POST http://localhost:3001/mine 
curl http://localhost:3001/blockchain  | jq
curl http://localhost:3002/blockchain | jq

##

curl -X POST -H 'Content-Type: application/json' -d @- http://localhost:3001/transaction/broadcast <<EOF
{
    "amount": 10340,
    "sender": "IU99N0A90WENNU234UFAW",
    "recipient": "IU9dddd9N0A90WENNU234UFAW"
}
EOF

curl -X POST http://localhost:3001/mine
curl -X POST -H 'Content-Type: application/json' -d @- http://localhost:3001/transaction <<EOF
{
    "amount": 100,
    "sender": "NNFAN90A09SNFAS",
    "recipient": "IU9dddd9N0A90WENNU234UFAW"
}
EOF
curl -X POST http://localhost:3001/mine

curl http://localhost:3001/block/00006b8fdbb6edbea41a0a88b386055f59d2200db418aa71cd0c0bd092eaa9de
curl http://localhost:3001/block/00006b8fdbb6edbea41a0a88b386055f59d2200db418aa71cd0c0bd092eaa9

curl http://localhost:3001/block/0000b5f516e06fe4ccafb927104b552bc6b17c3cb0f323af4a846ca05f7f903d

