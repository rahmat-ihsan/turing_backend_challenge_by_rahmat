/**
 * Customer controller handles all requests that has to do with customer
 * Some methods needs to be implemented from scratch while others may contain one or two bugs
 * 
 * - create - allow customers to create a new account
 * - login - allow customers to login to their account
 * - getCustomerProfile - allow customers to view their profile info
 * - updateCustomerProfile - allow customers to update their profile info like name, email, password, day_phone, eve_phone and mob_phone
 * - updateCustomerAddress - allow customers to update their address info
 * - updateCreditCard - allow customers to update their credit card number
 * 
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import { Customer } from '../database/models';

/**
 *
 *
 * @class CustomerController
 */
class CustomerController {
  /**
   * create a customer record
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status, customer data and access token
   * @memberof CustomerController
   */
  static async create(req, res, next) {

    try {
      //parameter name is not provided
      if (req.body.name == undefined) {
          var error = {status:400,code:"USR_02",message:"The field(s) are/is required.",field:"name"};
          return res.status(400).json({error});
      }

      //name too long. Others field's length should be checked too. this is just example
      if (req.body.name.length > 50) {
          var error = {status:400,code:"USR_07",message:"This is too long.",field:"name"};
          return res.status(400).json({error});
      }

      //parameter email is not provided
      if (req.body.email == undefined) {
          var error = {status:400,code:"USR_02",message:"The field(s) are/is required.",field:"email"};
          return res.status(400).json({error});
      }

      //invalid email
      var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (!re.test(String(req.body.email).toLowerCase())) {
          var error = {status:400,code:"USR_03",message:"The email is invalid.",field:"email"};
          return res.status(400).json({error});
      }

      //parameter password is not provided
      if (req.body.password == undefined) {
          var error = {status:400,code:"USR_02",message:"The field(s) are/is required.",field:"password"};
          return res.status(400).json({error});
      }

      Customer.create({ name: req.body.name, email: req.body.email, password: req.body.password }).then(customerNotFull => {
        Customer.findByPk(customerNotFull.customer_id).then(customer =>  {
            const jwt = require('jsonwebtoken');
            const token = jwt.sign({ id: customer.customer_id }, process.env.JWT_KEY);
            return res.status(201).json({ customer, accessToken:"Bearer "+token, expiresIn:"2099-12-31" });
          });
        }
      ).catch(err => {
        console.log(err);
        if (err.name.toLowerCase() == "SequelizeUniqueConstraintError".toLowerCase()) {
          if (err.fields.idx_customer_email != undefined) {
            var error = {status:400,code:"USR_04",message:"The email already exists.",field:"email"};
            return res.status(400).json({error});
          } /*else {
            var error = {status:400,code:"USR_11",message:"The name already exists.",field:"name"};
            return res.status(400).json({error});
          }*/
        }
        return res.status(400).json({ err });
      });
    } catch (error) {
      console.log("e2");
      return res.status(400).json({ error });
      //return next(error);
    }
  }

  /**
   * log in a customer
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status, and access token
   * @memberof CustomerController
   */
  static async login(req, res, next) {

      //parameter email is not provided
      if (req.body.email == undefined) {
          var error = {status:400,code:"USR_02",message:"The field(s) are/is required.",field:"email"};
          return res.status(400).json({error});
      }

      //parameter password is not provided
      if (req.body.password == undefined) {
          var error = {status:400,code:"USR_02",message:"The field(s) are/is required.",field:"password"};
          return res.status(400).json({error});
      }
    try {
      Customer.findAll({
        where : {
          email: req.body.email
        }
      }).then(customers =>  {
        if (customers.length > 0) {
          var customer = customers[0];
          customer.validatePassword(req.body.password).then(validPassword => {
            if (validPassword) {
              const jwt = require('jsonwebtoken');
              const token = jwt.sign({ customer_id: customer.customer_id }, process.env.JWT_KEY);
              return res.status(201).json({ customer, accessToken:"Bearer "+token, expiresIn:"2099-12-31" });
            } else {
              var error = {status:400,code:"USR_01",message:"email or password is invalid",field:"password"};
              return res.status(400).json({ error });
            }
          });
        } else {
          var error = {status:400,code:"USR_05",message:"The email doesn't exist",field:"email"};
              return res.status(400).json({ error });
        }
      });
    } catch (error) {
      return res.status(400).json({ error });
      //return next(error);
    }
  }

  /**
   * get customer profile data
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async getCustomerProfile(req, res, next) {
    // fix the bugs in this code
    const user_key = req.header('USER-KEY');  // eslint-disable-line
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }

    try {
      const jwt = require('jsonwebtoken');
      var decodedJwt = jwt.verify(user_key.replace("Bearer ",""), process.env.JWT_KEY);
      var customer_id = decodedJwt.customer_id;
      const customer = await Customer.findByPk(customer_id, {
        attributes: { exclude: ['password'] }
      });
      if (customer != null) {
        return res.status(200).json(customer);
      } else {
        var error = {status:400, code:"USR_11", message: `Customer not found`, field:"customer_id"};
        return res.status(400).json({error});
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * update customer profile data such as name, email, password, day_phone, eve_phone and mob_phone
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async updateCustomerProfile(req, res, next) {
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }

    try {
      const jwt = require('jsonwebtoken');
      var decodedJwt = jwt.verify(user_key.replace("Bearer ",""), process.env.JWT_KEY);
      var customer_id = decodedJwt.customer_id;
      const oldcustomer = await Customer.findByPk(customer_id, {
        attributes: { exclude: ['password'] }
      });
      if (oldcustomer != null) {
        //invalid email
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(String(req.body.email).toLowerCase())) {
            var error = {status:400,code:"USR_03",message:"The email is invalid.",field:"email"};
            return res.status(400).json({error});
        }

        //invalid phone number
        var rxphone = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;
        if (!rxphone.test(String(req.body.day_phone).toLowerCase())) {
            var error = {status:400,code:"USR_06",message:"this is an invalid phone number",field:"day_phone"};
            return res.status(400).json({error});
        }
        if (!rxphone.test(String(req.body.eve_phone).toLowerCase())) {
            var error = {status:400,code:"USR_06",message:"this is an invalid phone number",field:"eve_phone"};
            return res.status(400).json({error});
        }
        if (!rxphone.test(String(req.body.mob_phone).toLowerCase())) {
            var error = {status:400,code:"USR_06",message:"this is an invalid phone number",field:"mob_phone"};
            return res.status(400).json({error});
        }

        oldcustomer.email = req.body.email;
        oldcustomer.name = req.body.name;
        oldcustomer.day_phone = req.body.day_phone;
        oldcustomer.eve_phone = req.body.eve_phone;
        oldcustomer.mob_phone = req.body.mob_phone;
        oldcustomer.save().then(customer => {
          return res.status(200).json(customer);
        }).catch(err => {
          return next(err);
        });
      } else {
        var error = {status:400, code:"USR_11", message: `Customer not found`, field:"customer_id"};
        return res.status(400).json({error});
      }
    } catch (error) {
        return res.status(400).json({error});
    }
  }

  /**
   * update customer profile data such as address_1, address_2, city, region, postal_code, country and shipping_region_id
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async updateCustomerAddress(req, res, next) {
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }

    try {
      const jwt = require('jsonwebtoken');
      var decodedJwt = jwt.verify(user_key.replace("Bearer ",""), process.env.JWT_KEY);
      var customer_id = decodedJwt.customer_id;
      const oldcustomer = await Customer.findByPk(customer_id, {
        attributes: { exclude: ['password'] }
      });
      if (oldcustomer != null) {
        if (req.body.shipping_region_id != parseInt(req.body.shipping_region_id, 10)) {
          return res.status(400).json({
            error: {
              status: 400, code:"USR_09",
              message: `The Shipping Region ID is not number`,  // eslint-disable-line
            }
          });
        }
        oldcustomer.address_1 = req.body.address_1;
        oldcustomer.address_2 = req.body.address_2;
        oldcustomer.city = req.body.city;
        oldcustomer.region = req.body.region;
        oldcustomer.postal_code = req.body.postal_code;
        oldcustomer.shipping_region_id = req.body.shipping_region_id;
        oldcustomer.save().then(customer => {
          return res.status(200).json(customer);
        }).catch(err => {
          return next(err);
        });
      } else {
        var error = {status:400, code:"USR_11", message: `Customer not found`, field:"customer_id"};
        return res.status(400).json({error});
      }
    } catch (error) {
        return res.status(400).json({error});
    }
  }

  /**
   * update customer credit card
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status customer profile data
   * @memberof CustomerController
   */
  static async updateCreditCard(req, res, next) {
    const user_key = req.header('USER-KEY');
    if (user_key == null) {
          var error = {status:400,code:"AUT_01",message:"Authorization code is empty",field:"USER-KEY"};
              return res.status(400).json({ error });
    }
    if (req.body.credit_card == null) {
          var error = {status:400,code:"USR_08",message:"this is an invalid Credit Card",field:"credit_card"};
              return res.status(400).json({ error });
    }
    if (req.body.credit_card.length < 16) {
          var error = {status:400,code:"USR_08",message:"this is an invalid Credit Card",field:"USER-credit_card"};
              return res.status(400).json({ error });
    }

    try {
      const jwt = require('jsonwebtoken');
      var decodedJwt = jwt.verify(user_key.replace("Bearer ",""), process.env.JWT_KEY);
      var customer_id = decodedJwt.customer_id;
      const oldcustomer = await Customer.findByPk(customer_id, {
        attributes: { exclude: ['password'] }
      });
      if (oldcustomer != null) {
        oldcustomer.credit_card = req.body.credit_card;
        oldcustomer.save().then(customer => {
          return res.status(200).json(customer);
        }).catch(err => {
          return next(err);
        });
      } else {
        var error = {status:400, code:"USR_11", message: `Customer not found`, field:"customer_id"};
        return res.status(400).json({error});
      }
    } catch (error) {
        return res.status(400).json({error});
    }
  }
}

export default CustomerController;
