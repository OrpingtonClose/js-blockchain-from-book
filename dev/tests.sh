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