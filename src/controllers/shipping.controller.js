/**
 * The Shipping Controller contains all the static methods that handles all shipping request
 * This piece of code work fine, but you can test and debug any detected issue
 *
 * - getShippingRegions - Returns a list of all shipping region
 * - getShippingType - Returns a list of shipping type in a specific shipping region
 *
 */
import { ShippingRegion, Shipping } from '../database/models';

class ShippingController {
  /**
   * get all shipping regions
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and shipping regions data
   * @memberof ShippingController
   */
  static async getShippingRegions(req, res, next) {
    try {
      const shippingRegions = await ShippingRegion.findAll();
      return res.status(200).json(shippingRegions);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * get get shipping region shipping types
   *
   * @static
   * @param {object} req express request object
   * @param {object} res express response object
   * @param {object} next next middleware
   * @returns {json} json object with status and shipping types data
   * @memberof ShippingController
   */
  static async getShippingType(req, res, next) {
    const { shipping_region_id } = req.params; // eslint-disable-line
    if (shipping_region_id != parseInt(shipping_region_id, 10)) {
      return res.status(400).json({
        error: {
          status: 400, code:"SHIP_01",
          message: `The ID is not a number`,  // eslint-disable-line
        }
      });
    }
    try {
      const shippingTypes = await Shipping.findAll({
        where: {
          shipping_region_id,
        },
      });
      if (shippingTypes && shippingTypes.length > 0) {
        return res.status(200).json(shippingTypes);
      } 
      return res.status(400).json({
        error: {
          status: 400, code:"SHIP_02",
          message: `Shipping with region id ${shipping_region_id} does not exist`,  // eslint-disable-line
        }
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default ShippingController;
