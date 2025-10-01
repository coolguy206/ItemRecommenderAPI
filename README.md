
# Item Recommendations

An api using REST to get recommendations


## Installation

Clone the repo

```bash
  git clone https://github.com/coolguy206/ItemRecommenderAPI.git
```

Install the npm packages

```bash
  npm install
```
    
## Environment Variables

Create a .env file in the root directory.  
To run this project, you will need to add the following environment variables to your .env file.  
**Please note** that your account also needs to have the access to the REST API

`TEA_REST_API_USERNAME`= { YOUR USERNAME }

`TEA_REST_API_PASSWORD`= { YOUR PASSWORD }

it is ok if you don't have this but   
to get a free Google AI apikey go to: https://aistudio.google.com/app/api-keys   

`GOOGLE_AI_APIKEY`= { YOUR GOOGLE AI API KEY }

`PORT`=3000


## Run Locally

Start the server

```bash
  npm start
```

In your web browser go to:

```bash
  http://localhost:3000/
```

## Documentation

There are several routes that will return JSON

### Route to get 100 pdp items 
`http://localhost:3000/items/`

### Route to get a single pdp item 
`http://localhost:3000/items/{ SKU }/{ MODEL }`  

example:

`http://localhost:3000/items/24F12152/Printed Slim Long Sleeve Top`

### Route to get recommendations for a single pdp

`http://localhost:3000/items/recommendations/{ SKU }/{ MODEL }`  

example:  

`http://localhost:3000/items/recommendations/24F12152/Printed Slim Long Sleeve Top`

The recommendations are offered by two ways.  
1. first, the recommendations will GET 100 orders starting from the beginning of the month. From those orders it will check if any of these orders have purchased this item. If there are purchases, then recommendations will grab the rest of the ordered items from that order and put in an object array **bySku**.
2. Second, sometimes there are no purchases that are involved with this item. In that case recommendations will be based on the name of the item. The recommendations will GET 100 orders starting from the beginning of the month. From those orders it will check if the name of the ordered item matches any word of the item's name. If it does it will put that ordered item in an object array **byModel**. 

### Route to get 100 orders from today

`http://localhost:3000/orders/`

### Route to get recommendations for a user by email  (YOU NEED THE GOOGLE AI API KEY FOR THIS ONE)

`http://localhost:3000/orders/{EMAIL}`

The recommendations here are offered by Google AI API.  
First the recommendations will GET the user's latest orders. Then from those purchased items we ask Google AI to recommend 5 items from the 100 items that the user will most likely buy and has not purchased yet. 

