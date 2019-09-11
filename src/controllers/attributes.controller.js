/**
 * The controller defined below is the attribute controller, highlighted below are the functions of each static method
 * in the controller
 *  Some methods needs to be implemented from scratch while others may contain one or two bugs
 * 
 * - getAllAttributes - This method should return an array of all attributes
 * - getSingleAttribute - This method should return a single attribute using the attribute_id in the request parameter
 * - getAttributeValues - This method should return an array of all attribute values of a single attribute using the attribute id
 * - getProductAttributes - This method should return an array of all the product attributes
 * NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import {
  Product,
  Department,
  AttributeValue,
  Attribute,
  Category,
  Sequelize,
} from '../database/models';

const { Op } = Sequelize;

class AttributeController {
  /**
   * This method get all attributes
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getAllAttributes(req, res, next) {
    try {
      const attributes = await Attribute.findAll();
      return res.status(200).json(attributes);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * This method gets a single attribute using the attribute id
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getSingleAttribute(req, res, next) {
    const { attribute_id } = req.params; // eslint-disable-line
    if (attribute_id != parseInt(attribute_id, 10)) {
      return res.status(400).json({
        error: {
          status: 400, code:"ATT_02",
          message: `The ID is not a number`,  // eslint-disable-line
        }
      });
    }
    try {
      const attribute = await Attribute.findByPk(attribute_id);
      if (attribute) {
        return res.status(200).json(attribute);
      }
      return res.status(400).json({
        error: {
          status: 400, code:"ATT_01",
          message: `Attribute with id ${attribute_id} does not exist`,  // eslint-disable-line
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * This method gets a list attribute values in an attribute using the attribute id
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getAttributeValues(req, res, next) {
    const { attribute_id } = req.params; // eslint-disable-line
    if (attribute_id != parseInt(attribute_id, 10)) {
      return res.status(400).json({
        error: {
          status: 400, code:"ATT_02",
          message: `The ID is not a number`,  // eslint-disable-line
        }
      });
    }
    try {
      const { attribute_id } = req.params; // eslint-disable-line

      const sqlQueryMap = {
        attributes: [],
        include: [
          {
            model: AttributeValue,
            attributes: ['attribute_value_id','value'],
            where: {
              attribute_id,
            },
          },
        ],
      };
      const attributes = await Attribute.findAndCountAll(sqlQueryMap);

      if (attributes.count>0) {
        var rows = attributes.rows[0].AttributeValues;
        return res.status(200).json(rows);
      } else {
        var error = {status:400,code:"ATT_01",message:"Attribute doesn't exist",field:"attribute"};
        return res.status(400).json({error});
      }
    } catch (error) {
      return next(error);
    }
  }

  /**
   * This method gets a list attribute values in a product using the product id
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getProductAttributes(req, res, next) {
    try {
      const { product_id } = req.params; // eslint-disable-line
      if (product_id != parseInt(product_id, 10)) {
        return res.status(400).json({
          error: {
            status: 400, code:"ATT_02",
            message: `The ID is not a number`,  // eslint-disable-line
          }
        });
      }

      const sqlQueryMap = {
        attributes:[[AttributeValue.sequelize.literal('attribute_type.name'),'attribute_name'],'attribute_value_id',['value','attribute_value']],
        include: [
          {
            model: Product,
            attributes:[],
            where: {
              product_id,
            }
          },
          {
            model: Attribute,
            as: 'attribute_type',
            attributes:[]
          },
        ],
      };
      const products = await AttributeValue.findAndCountAll(sqlQueryMap);

      if (products.count>0) {
        var row = products.rows;
        return res.status(200).json(row);
      } else {
        var error = {status:400,code:"ATT_03",message:"Product doesn't exist",field:"product"};
        return res.status(400).json({error});
      }
    } catch (error) {
      return next(error);
    }
  }
}

export default AttributeController;
