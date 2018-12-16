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