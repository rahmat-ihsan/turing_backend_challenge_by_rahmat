# Turing Back End Challenge
To complete this challenge, you need to ensure all route returns a similar response object as described in our API guide.
To achieve this goal
- You will have to fix the existing bugs
- Implement the incomplete functions,
- Add test cases for the main functions of the system.
- Add Dockerfile to the root of the project to run the app in docker environment


## Getting started

### Prerequisites

In order to install and run this project locally, you would need to have the following installed on you local machine.

* [**Node JS**](https://nodejs.org/en/)
* [**Express**](https://expressjs.com/)
* [**MySQL**](https://www.mysql.com/downloads/)

### Installation

* Clone this repository

* Navigate to the project directory

* Run `npm install` or `yarn` to instal the projects dependencies
* create a `.env` file and copy the contents of the `.env.sample` file into it and supply the values for each variable

```sh
cp .env.sample .env
```
* Create a MySQL database and run the `sql` file in the database directory to migrate the database

```sh
mysql -u <dbuser> -D <databasename> -p < ./src/database/database.sql
```

* Run `npm run dev` to start the app in development

## Docker

* Build image

`docker build -t node_challenge .`

* Run container
`docker run --rm -p 8000:80 node_challenge`

## Request and Response Object API guide for all Endpoints
Check [here](https://docs.google.com/document/d/1J12z1vPo8S5VEmcHGNejjJBOcqmPrr6RSQNdL58qJyE/edit?usp=sharing)

## Error Documentation
Check in outer folder

## Tools
I use these tools :
- Sequelize for ORM tools
- JWT for Authentication using Bearer Scheme.
- uniqid (UUID)
	Note : in the shopping_cart table, i modify column cart_id from char(32) to char(36), because the length of UUID is 36.
- Stripe for payment.

I use this technique :
- Transaction for create order (orders and order_detail), so that if something happen in the middle of process, it can be automatically rolled back by database (ACID principle). Example : a customer take order with 4 item, then 2 item has been save, but server down, then it rolled back.

## Advanced Requirement
Check in outer folder