
/**
 * Tax controller contains methods which are needed for all tax request
 * Implement the functionality for the methods
 * 
 *  NB: Check the BACKEND CHALLENGE TEMPLATE DOCUMENTATION in the readme of this repository to see our recommended
 *  endpoints, request body/param, and response object for each of these method
 */
import { Tax } from '../database/models';
class TaxController {
  /**
   * This method get all taxes
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getAllTax(req, res, next) {
    try {
      const taxes = await Tax.findAll();
      return res.status(200).json(taxes);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * This method gets a single tax using the tax id
   * @param {*} req
   * @param {*} res
   * @param {*} next
   */
  static async getSingleTax(req, res, next) {
    const { tax_id } = req.params; // eslint-disable-line
    if (tax_id != parseInt(tax_id, 10)) {
      return res.status(400).json({
        error: {
          status: 400, code:"TAX_01",
          message: `The ID is not a number`,  // eslint-disable-line
        }
      });
    }
    try {
      const tax = await Tax.findByPk(tax_id);
      if (tax != null) {
        return res.status(200).json(tax);
      } 
      return res.status(400).json({
        error: {
          status: 400, code:"TAX_02",
          message: `Tax with id ${tax_id} does not exist`,  // eslint-disable-line
        }
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default TaxController;
