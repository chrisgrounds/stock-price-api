global.fetch = require('node-fetch');

const { DynamoDB } = require("aws-sdk");

const API_KEY = process.env.API_KEY;
const TableName = "stock-price-table";
const CACHE_TTL = 15 * 60 * 1000;

const db = new DynamoDB.DocumentClient();

exports.lambdaHandler = async (event, context) => {
  const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=ADA&to_currency=USD&apikey=${API_KEY}`;

  const { Item } = await db.get({
    TableName,
    Key: {
      id: "latestprice"
    }
  }).promise();

  if (Item) {
    const elapsedTime = Date.now() - Item.timestamp;

    if (elapsedTime < CACHE_TTL) {
      return {
        "statusCode": 200,
        "body": JSON.stringify({
          ada: Item.price,
          cached: {
            status: true,
            timestamp: Item.timestamp,
            ttl_remaining_ms: CACHE_TTL - elapsedTime,
          },
        })
      }
    } 
  }

  const response = await fetch(url, {
    json: true,
    headers: { "User-Agent": "request" }
  });

  const data = await response.json();

  if (data) {
    const adaPrice = data["Realtime Currency Exchange Rate"]["5. Exchange Rate"];

    await db.put({
      TableName,
      Item: {
        id: "latestprice",
        price: adaPrice,
        timestamp: Date.now()
      }
    }).promise();

    return {
      "statusCode": 200,
      "body": JSON.stringify({
        ada: adaPrice,
        cached: {
          status: false,
          ttl_remaining_ms: CACHE_TTL,
        },      
      })
    }
  } else {
    return {
      "statusCode": 500,
      "body": {
        "msg": JSON.stringify(error)
      }
    }
  }
}
