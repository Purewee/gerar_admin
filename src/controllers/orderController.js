/**
 * Order Controller (backend reference implementation)
 * GET /api/admin/orders/all: no query params → getAllOrders(); any query param → searchOrders(filters).
 */

const { getAllOrders: getAllOrdersFromDb, searchOrders: searchOrdersFromService } = require('../services/orderService');

/**
 * Get all orders (list) or advanced search with pagination.
 * - No query params: calls getAllOrders() and returns all orders (same as before).
 * - Any query param present: calls searchOrders(filters) and returns data plus pagination (total, page, limit, totalPages).
 */
async function getAllOrders(req, res) {
  try {
    const query = req.query || {};
    const hasAnyParam = Object.keys(query).length > 0;

    if (!hasAnyParam) {
      // Same as before: return all orders (replace with your existing getAllOrders implementation)
      const orders = await getAllOrdersFromDb();
      return res.status(200).json({
        success: true,
        message: 'All orders retrieved successfully',
        data: orders,
      });
    }

    // Advanced search: build filters from query params
    const filters = {
      orderId: query.orderId,
      status: query.status,
      paymentStatus: query.paymentStatus,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      deliveryDateFrom: query.deliveryDateFrom,
      deliveryDateTo: query.deliveryDateTo,
      phone: query.phone,
      name: query.name,
      totalMin: query.totalMin != null ? Number(query.totalMin) : undefined,
      totalMax: query.totalMax != null ? Number(query.totalMax) : undefined,
      deliveryTimeSlot: query.deliveryTimeSlot,
      page: query.page != null ? Number(query.page) : 1,
      limit: query.limit != null ? Math.min(100, Math.max(1, Number(query.limit))) : 50,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    };

    const { orders, total, page, limit, totalPages } = await searchOrdersFromService(filters);

    return res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
      pagination: { total, page, limit, totalPages },
    });
  } catch (error) {
    console.error('getAllOrders error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve orders',
    });
  }
}

module.exports = {
  getAllOrders,
};
