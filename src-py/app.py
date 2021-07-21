import json
import yahoo_fin.stock_info

def handler(event, context):
  ticker = event["queryStringParameters"]["ticker"]

  if ticker:
    price = yahoo_fin.stock_info.get_live_price(ticker)

    return {
      "statusCode": 200,
      "body": json.dumps({
        "ticker": ticker,
        "price": price,
      })
    }

  return {
    "statusCode": 200,
    "body": json.dumps({
      "msg": "Please provide a ticker as a query parameter (i.e. ?ticker=tsla)",
    })
  }
