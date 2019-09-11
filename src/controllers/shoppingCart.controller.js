/**
 * Check each method in the shopping cart controller and add code to implement
 * the functionality or fix any bug.
 * The static methods and their function include:
 * 
 * - generateUniqueCart - To generate a unique cart id
 * - addItemToCart - To add new product to the cart
 * - getCart - method to get list of items in a cart
 * - updateCartItem - Update the quantity of a product in the shopping cart
 * - emptyCart - should be able to clear shopping cart
 * - removeItemFromCart - should delete a product from the shopping cart
 * - createOrder - Create an order
 * - getCustomerOrders - get all orders of a customer
 * - getOrderSummary - get the details of an order
 * - processStripePayment - process stripe payment
 * 
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import { ShoppingCart, Order, OrderDetail, Product, Customer } from '../database/models';

 
/**
 *
 *
 * @class shoppingCartController
 */
class ShoppingCartController {
  /**
   * generate random unique id for cart identifier
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart_id
   * @memberof shoppingCartController
   */
  static generateUniqueCart(req, res) {
    // implement method to generate unique cart Id
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    const uuidv1 = require('uuid/v1');
    var uniqueId = {
      //example 1 : 3c759f50-cfc1-11e9-9893-8365c36786a1
      //example 2 : 570f0270-cfc1-11e9-9893-8365c36786a1
      cart_id:uuidv1()
    }
    return res.status(200).json(uniqueId);
  }

  /**
   * adds item to a cart with cart_id
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async addItemToCart(req, res, next) {

    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    try {
      //parameter cart_id is not provided
      if (req.body.cart_id == undefined) {
          var error = {status:400,code:"SHOP_01",message:"body post parameter cart_id not provided.",field:"name"};
          return res.status(400).json({error});
      }

      //parameter product_id is not provided
      if (req.body.product_id == undefined) {
          var error = {status:400,code:"SHOP_02",message:"body post parameter product_id not provided.",field:"name"};
          return res.status(400).json({error});
      }

      var attributes = "";
      if (req.body.attributes != undefined) {
        attributes = req.body.attributes;
      }

      //parameter quantity is not provided
      if (req.body.quantity == undefined) {
          var error = {status:400,code:"SHOP_03",message:"body post parameter quantity not provided.",field:"name"};
          return res.status(400).json({error});
      }

      ShoppingCart.create({ cart_id: req.body.cart_id, product_id: req.body.product_id, 
        attributes: req.body.attributes, quantity: req.body.quantity }).then(cart => {
        ShoppingCart.findByPk(cart.item_id, {
          attributes: { exclude: ['buy_now','added_on'] }
        }).then(shoppingCart =>  {
            return res.status(201).json(shoppingCart);
          });
        }
      ).catch(function (err) {
        return next(err);
      });
    } catch (error) {
      return res.status(400).json({ error });
      //return next(error);
    }
  }

  /**
   * get shopping cart using the cart_id
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async getCart(req, res, next) {
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    const { cart_id } = req.params;
    try {
      ShoppingCart.findAll({
        where : {cart_id: cart_id},
        attributes: 
        [
          'item_id','cart_id',
          [ShoppingCart.sequelize.literal('Product.name'),'name'],
          'attributes',
          'product_id',
          [ShoppingCart.sequelize.literal('Product.image'),'image'],
          [ShoppingCart.sequelize.literal('Product.price'),'price'],
          [ShoppingCart.sequelize.literal('Product.discounted_price'),'discounted_price'],
          'quantity',
          [ShoppingCart.sequelize.literal('quantity*Product.discounted_price'),'subtotal']
        ],
        include:[{
          model: Product,
          attributes: []
        }]
      }).then(cart =>  {
              return res.status(200).json( cart );
      });
    } catch (error) {
      return res.status(400).json({ error });
      //return next(error);
    }
  }

  /**
   * update cart item quantity using the item_id in the request param
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async updateCartItem(req, res, next) {
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    const { item_id } = req.params // eslint-disable-line
    if (item_id != parseInt(item_id, 10)) {
      return res.status(400).json({
        error: {
          status: 400, code:"SHOP_04",
          message: `The ID is not a number`,  // eslint-disable-line
        }
      });
    }
    //parameter quantity is not provided
    if (req.body.quantity == undefined) {
        var error = {status:400,code:"SHOP_03",message:"body post parameter quantity not provided.",field:"name"};
        return res.status(400).json({error});
    }
    try {
      const cart = await ShoppingCart.findByPk(item_id, {
          attributes: { exclude: ['buy_now','added_on'] }});
      if (cart != null) {
        cart.quantity = req.body.quantity;
        cart.save().then(newcart => {
          return res.status(200).json(newcart);
        }).catch(err => {
          return next(err);
        });
      } else {
        var error = {status:400, code:"SHOP_08", message: `Item not found`, field:"item_id"};
        return res.status(400).json({error});
      }
    } catch (error) {
        return res.status(400).json({error});
    }
  }

  /**
   * removes all items in a cart
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with cart
   * @memberof ShoppingCartController
   */
  static async emptyCart(req, res, next) {
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    const { cart_id } = req.params // eslint-disable-line
    if (item_id != parseInt(item_id, 10)) {
      return res.status(400).json({
        error: {
          status: 400, code:"SHOP_04",
          message: `The ID is not a number`,  // eslint-disable-line
        }
      });
    }
    try {
      const cart = await ShoppingCart.Destroy({
          where : {
            cart_id: cart_id
          }
      }).then(affectedRows => {
          if (affectedRows > 0) {
            return res.status(200).json("[]");
          } else {
            var error = {status:400, code:"SHOP_09", message: `Cart not found`, field:"customer_id"};
            return res.status(400).json({error});
          }
        }).catch(err => {
          return next(err);
        });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * remove single item from cart
   * cart id is obtained from current session
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with message
   * @memberof ShoppingCartController
   */
  static async removeItemFromCart(req, res, next) {
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    const { item_id } = req.params // eslint-disable-line
    if (item_id != parseInt(item_id, 10)) {
      return res.status(400).json({
        error: {
          status: 400, code:"SHOP_04",
          message: `The ID is not a number`,  // eslint-disable-line
        }
      });
    }
    try {
      const cart = await ShoppingCart.findByPk(item_id);
      if (cart != null) {
        cart.destroy().then(newcart => {
          var msg = {
            message: "Delete succeeded"
          };
          return res.status(200).json(msg);
        }).catch(err => {
          return next(err);
        });
      } else {
        var error = {status:400, code:"SHOP_08", message: `Item not found`, field:"customer_id"};
        return res.status(400).json({error});
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * create an order from a cart
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with created order
   * @memberof ShoppingCartController
   */
  static async createOrder(req, res, next) {
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }

    //parameter cart_id is not provided
    if (req.body.cart_id == undefined) {
        var error = {status:400,code:"SHOP_01",message:"body post parameter cart_id not provided.",field:"cart_id"};
        return res.status(400).json({error});
    }

    //parameter shipping_id is not provided
    if (req.body.shipping_id == undefined) {
        var error = {status:400,code:"SHOP_12",message:"body post parameter shipping_id not provided.",field:"shipping_id"};
        return res.status(400).json({error});
    }

    //parameter tax_id is not provided
    if (req.body.tax_id == undefined) {
        var error = {status:400,code:"SHOP_13",message:"body post parameter tax_id not provided.",field:"tax_id"};
        return res.status(400).json({error});
    }

    try {
      const jwt = require('jsonwebtoken');
      var decodedJwt = jwt.verify(user_key.replace("Bearer ",""), process.env.JWT_KEY);
      var customer_id = decodedJwt.customer_id;
      // const customer = await Customer.findByPk(customer_id, {
      //   attributes: { exclude: ['password'] }
      // });
      var cart = await ShoppingCart.findAll({
        where : {cart_id: req.body.cart_id},
        attributes: 
        [
          'item_id','cart_id',
          [ShoppingCart.sequelize.literal('Product.name'),'name'],
          'attributes',
          'product_id',
          [ShoppingCart.sequelize.literal('Product.image'),'image'],
          [ShoppingCart.sequelize.literal('Product.price'),'price'],
          [ShoppingCart.sequelize.literal('Product.discounted_price'),'discounted_price'],
          'quantity',
          [ShoppingCart.sequelize.literal('quantity*Product.discounted_price'),'subtotal']
        ],
        include:[{
          model: Product,
          attributes: []
        }]
      });
      console.log(cart);
      var total = 0;
      for (var i = 0, len = cart.length; i < len; i++) {
        console.log(cart[i].dataValues.subtotal);

        //possible bug float precision??? example : 0.2 + 0.4 = 0.6000000000000001
        total = total+parseFloat(cart[i].dataValues.subtotal);

        console.log(total);
      }

      let transaction;
      try {
        transaction = await Order.sequelize.transaction();
        let order = await Order.create({
          tax_id: req.body.tax_id,
          shipping_id: req.body.shipping_id,
          customer_id: customer_id,
          auth_code: user_key,
          total_amount: total,
          reference: req.body.cart_id
        }, {transaction});
        var order_id = order.order_id;
        for (var i = 0, len = cart.length; i < len; i++) {
          await OrderDetail.create({
              item_id: cart[i].item_id,
              order_id: order_id,
              product_id: cart[i].product_id,
              attributes: cart[i].attributes,
              product_name: cart[i].dataValues.name,
              quantity: cart[i].quantity,
              unit_cost: cart[i].dataValues.discounted_price
            }, {transaction});
        }

        await transaction.commit();
      } catch (err) {
        console.log(err);
        await transaction.rollback();
        return next(err);
      }
      if (transaction.finished === 'commit') {
        Order.findByPk(order_id, {
            include:[{
              model: OrderDetail,
              as: 'orderItems',
              attributes: ['product_id',
               'attributes',
               'product_name',
               'quantity',
               'unit_cost',
               [OrderDetail.sequelize.literal('orderItems.quantity*orderItems.unit_cost'),'subtotal']]
            }]
          }).then(order => {
            return res.status(200).json(order);
          });
      } else {
        var error = {status:400,code:"SHOP_99",message:"Transaction not Commited",field:"orders"};
        return res.status(400).json({error});
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   *
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with customer's orders
   * @memberof ShoppingCartController
   */
  static async getCustomerOrders(req, res, next) {
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    try {
      const jwt = require('jsonwebtoken');
      var decodedJwt = jwt.verify(user_key.replace("Bearer ",""), process.env.JWT_KEY);
      var customer_id = decodedJwt.customer_id;
      
      Order.findAll({
        attributes:['order_id','total_amount','created_on','shipped_on',[Order.sequelize.literal('Customer.name'),'name']],
        include:[{
          model: Customer,
          attributes:[]
        }],
        where: {
          customer_id: customer_id
        }
      }).then(orders => {
        if (orders.length > 0) {
          return res.status(200).json(orders);
        } else {
          var error = {status:400,code:"SHOP_15",message:"There is no order for this customer", field:"customer_id"};
              return res.status(400).json({ error });
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   *
   *
   * @static
   * @param {obj} req express request object
   * @param {obj} res express response object
   * @returns {json} returns json response with order summary
   * @memberof ShoppingCartController
   */
  static async getOrderSummary(req, res, next) {
    const { order_id } = req.params;  // eslint-disable-line
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    try {
      Order.findByPk(order_id, {
        attributes:['order_id'],
        include:[{
          model: OrderDetail,
          as: 'orderItems',
          attributes: ['product_id',
           'attributes',
           'product_name',
           'quantity',
           'unit_cost',
           [OrderDetail.sequelize.literal('quantity*unit_cost'),'subtotal']]
        }]
      }).then(order => {
        return res.status(200).json(order);
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getShortOrder(req, res, next) {
    const { order_id } = req.params;  // eslint-disable-line
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    try {
      Order.findByPk(order_id, {
        attributes:['order_id','total_amount','created_on','shipped_on','status',
          [Order.sequelize.literal('Customer.name'),'name']],
        include:[{
          model: Customer,
          attributes:[]
        }],
      }).then(order => {
        return res.status(200).json(order);
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * @static
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async processStripePayment(req, res, next) {
    const { email, stripeToken, order_id } = req.body; // eslint-disable-line

    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    try {
      const jwt = require('jsonwebtoken');
      var decodedJwt = jwt.verify(user_key.replace("Bearer ",""), process.env.JWT_KEY);
      var customer_id = decodedJwt.customer_id;

      const order = await Order.findByPk(order_id, {
        attributes:['order_id','total_amount','created_on','shipped_on','status',
          [Order.sequelize.literal('Customer.name'),'name']],
        include:[{
          model: Customer,
          attributes:[]
        }],
      });

      const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
      // Create a payment from a test card token.
      let amount = Math.ceil(order.total_amount);

      stripe.customers.create({
        email: email,
        source: stripeToken,
        customer: order.customer_id
      })
      .then(customer =>
        stripe.charges.create({
          amount: amount,
          description: "Example Charge",
          currency: "usd",
          source: stripeToken,
          customer: order.customer_id,
          metadata: {'order_id': order_id}
        }))
      .then(charge => res.status(200).json(charge)).catch(err => {
        return res.status(400).json(err);
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default ShoppingCartController;
