// controllers/subscriptionControllers.js
const MercadoPago = require('mercadopago').default;
const mp = new MercadoPago({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const User = require('../models/userModels');
const Subscription = require('../models/publicationModels');
const { getIO } = require('../sockets');
// Suponiendo que reutilizaremos la lógica de follow
const Follow = require('../models/followModels');

const createSubscription = async (req, res) => {
  try {
    const { vendedorId, amount } = req.body;
    const suscriptorEmail = req.user.email;
    const subscriberId = req.user.id;

    // Obtener el vendedor para extraer su collector_id (vinculado a Mercado Pago)
    const vendedor = await User.findById(vendedorId);
    if (!vendedor || !vendedor.mercadoPagoCollectorId) {
      return res.status(400).json({
        status: "error",
        message: "El vendedor no tiene vinculada su cuenta de Mercado Pago",
      });
    }
    const vendedorMercadoPagoId = vendedor.mercadoPagoCollectorId;

    // Configuración de la preferencia de preapproval (suscripción recurrente)
    const subscriptionData = {
      reason: `Suscripción mensual al vendedor ${vendedorId}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: parseFloat(amount),
        currency_id: "ARS",
      },
      payer_email: suscriptorEmail,
      back_url: {
        success: "http://localhost:3000/payment-success",
        failure: "http://localhost:3000/payment-failure",
        pending: "http://localhost:3000/payment-pending",
      },
      auto_return: "approved",
      external_reference: subscriberId,
      binary_mode: true,
      // Parámetros para split payment:
      collector_id: vendedorMercadoPagoId,
      application_fee: parseFloat(amount) * 0.10, // Ejemplo: retener 10% como comisión
    };

    // Crear la preferencia en Mercado Pago
    const response = await mp.preapproval.create(subscriptionData);

    // Guardar la suscripción en la base de datos con estado 'pending'
    const newSubscription = new Subscription({
      subscriber: subscriberId,
      vendor: vendedorId,
      preapproval_id: response.body.id,
      transaction_amount: parseFloat(amount),
      status: "pending",
    });
    await newSubscription.save();

    // Emitir evento vía socket (opcional)
    getIO().emit('subscriptionCreated', {
      subscriber: subscriberId,
      vendor: vendedorId,
      subscriptionId: newSubscription._id,
    });

    return res.status(200).json({
      status: "success",
      init_point: response.body.init_point,
      preapproval_id: response.body.id,
      subscription: newSubscription,
      response: response.body,
    });
  } catch (error) {
    console.error("Error al crear la suscripción:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al crear la suscripción",
      error,
    });
  }
};

// Ejemplo de endpoint para actualizar el estado de la suscripción (por ejemplo, llamado desde un webhook o tras redirección exitosa)
const updateSubscriptionStatus = async (req, res) => {
  try {
    const { preapproval_id, newStatus } = req.body;
    // Buscar la suscripción por preapproval_id
    const subscription = await Subscription.findOne({ preapproval_id });
    if (!subscription) {
      return res.status(404).json({
        status: "error",
        message: "Suscripción no encontrada",
      });
    }
    // Actualizar el estado
    subscription.status = newStatus; // 'active' o 'canceled'
    await subscription.save();

    // Si la suscripción se activa, podrías invocar la lógica de follow
    if (newStatus === "active") {
      // Se podría reutilizar la lógica de Follow aquí
      // Por ejemplo, crear un follow (si no se creó anteriormente)
      const existingFollow = await Follow.findOne({
        user: subscription.subscriber,
        followed: subscription.vendor,
      });
      if (!existingFollow) {
        const newFollow = new Follow({
          user: subscription.subscriber,
          followed: subscription.vendor,
        });
        await newFollow.save();
      }
    }

    // En caso de cancelación, podrías eliminar el follow
    if (newStatus === "canceled") {
      await Follow.deleteOne({
        user: subscription.subscriber,
        followed: subscription.vendor,
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Estado de suscripción actualizado",
      subscription,
    });
  } catch (error) {
    console.error("Error al actualizar la suscripción:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al actualizar la suscripción",
      error,
    });
  }
};

const subscriptionStatus = async (req, res) => {
  try {
    const { vendedorId } = req.query;
    // Buscamos si existe alguna suscripción activa entre el usuario logueado y el vendedor
    const subscription = await Subscription.findOne({
      subscriber: req.user.id,
      vendor: vendedorId,
      status: "active",
    });
    return res.status(200).json({
      status: "success",
      isSubscribed: subscription ? true : false,
      subscription,
    });
  } catch (error) {
    console.error("Error al obtener el estado de suscripción:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al obtener el estado de suscripción",
      error,
    });
  }
};

module.exports = {
  createSubscription,
  updateSubscriptionStatus,
  subscriptionStatus,
};