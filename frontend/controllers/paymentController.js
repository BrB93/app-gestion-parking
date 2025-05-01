import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { Payment } from "../models/payment.js";
import { renderPayments, renderPaymentForm } from "../views/paymentView.js";
import { getCurrentUser } from "./authController.js";

export async function loadPayments() {
    try {
      console.log("Chargement des paiements...");
      const data = await fetchJSON("/app-gestion-parking/public/api/payments");
      console.log("Données de paiements reçues:", data);
      
      // Vérifier si data est un tableau
      if (!Array.isArray(data)) {
        console.error("Erreur: Les données reçues ne sont pas un tableau", data);
        
        const container = document.getElementById("payment-list");
        if (container) {
          container.innerHTML = `<p class="error-message">Erreur de chargement: ${data.error || "Format de données incorrect"}</p>`;
        }
        return;
      }
      
      const payments = data.map(payment => new Payment(
        payment.id,
        payment.reservation_id,
        payment.amount,
        payment.method,
        payment.status,
        payment.timestamp
      ));
      
      renderPayments(payments);
      setupPaymentEvents();
    } catch (error) {
      console.error("Erreur lors du chargement des paiements:", error);
      
      const container = document.getElementById("payment-list");
      if (container) {
        container.innerHTML = `<p class="error-message">Erreur de chargement: ${error.message}</p>`;
      }
    }
  }

export async function getPayment(id) {
  try {
    const data = await fetchJSON(`/app-gestion-parking/public/api/payments/${id}`);
    return new Payment(
      data.id,
      data.reservation_id,
      data.amount,
      data.method,
      data.status,
      data.timestamp
    );
  } catch (error) {
    console.error(`Erreur lors de la récupération du paiement ${id}:`, error);
    return null;
  }
}

export async function processPayment(reservationId, amount, method, paymentData = {}) {
  try {
    const data = {
      reservation_id: reservationId,
      amount: amount,
      method: method,
      ...paymentData
    };
    
    const response = await postJSON("/app-gestion-parking/public/api/payments/process", data);
    return response;
  } catch (error) {
    console.error("Erreur lors du traitement du paiement:", error);
    return { error: error.message };
  }
}

export async function confirmPayment(id) {
  try {
    const response = await postJSON(`/app-gestion-parking/public/api/payments/${id}/confirm`, {});
    return response;
  } catch (error) {
    console.error(`Erreur lors de la confirmation du paiement ${id}:`, error);
    return { error: error.message };
  }
}

export async function cancelPayment(id) {
  try {
    const response = await postJSON(`/app-gestion-parking/public/api/payments/${id}/cancel`, {});
    return response;
  } catch (error) {
    console.error(`Erreur lors de l'annulation du paiement ${id}:`, error);
    return { error: error.message };
  }
}

export function setupPaymentEvents() {
  document.querySelectorAll('.btn-confirm-payment').forEach(button => {
    button.addEventListener('click', async () => {
      const paymentId = button.getAttribute('data-id');
      try {
        const result = await confirmPayment(paymentId);
        if (result.success) {
          alert("Paiement confirmé avec succès");
          loadPayments();
        } else {
          alert(`Erreur: ${result.error}`);
        }
      } catch (error) {
        console.error("Erreur:", error);
        alert("Une erreur est survenue");
      }
    });
  });

  document.querySelectorAll('.btn-cancel-payment').forEach(button => {
    button.addEventListener('click', async () => {
      const paymentId = button.getAttribute('data-id');
      if (confirm("Êtes-vous sûr de vouloir annuler ce paiement ?")) {
        try {
          const result = await cancelPayment(paymentId);
          if (result.success) {
            alert("Paiement annulé avec succès");
            loadPayments();
          } else {
            alert(`Erreur: ${result.error}`);
          }
        } catch (error) {
          console.error("Erreur:", error);
          alert("Une erreur est survenue");
        }
      }
    });
  });
  
  document.querySelectorAll('.btn-pay-reservation').forEach(button => {
    button.addEventListener('click', () => {
      const reservationId = button.getAttribute('data-reservation-id');
      const amount = parseFloat(button.getAttribute('data-amount'));
      showPaymentForm(reservationId, amount);
    });
  });
}

export function showPaymentForm(reservationId, amount) {
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';
  modalContainer.id = 'payment-modal';
  
  modalContainer.innerHTML = renderPaymentForm(reservationId, amount);
  document.body.appendChild(modalContainer);
  
  const form = document.getElementById('payment-form');
  const cancelBtn = document.getElementById('cancel-payment-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const method = document.querySelector('input[name="payment_method"]:checked').value;
    const errorElement = document.getElementById('form-error');
    
    try {
      let paymentData = {};
      
      if (method === 'cb') {
        const cardNumber = document.getElementById('card_number').value;
        const cardExpiry = document.getElementById('card_expiry').value;
        const cardCvv = document.getElementById('card_cvv').value;
        
        if (!cardNumber || !cardExpiry || !cardCvv) {
          errorElement.textContent = "Veuillez remplir tous les champs";
          return;
        }
        
        paymentData = {
          card_number: cardNumber,
          card_expiry: cardExpiry,
          card_cvv: cardCvv
        };
      } else if (method === 'paypal') {
        const paypalEmail = document.getElementById('paypal_email').value;
        
        if (!paypalEmail) {
          errorElement.textContent = "Veuillez saisir votre email PayPal";
          return;
        }
        
        paymentData = {
          paypal_email: paypalEmail
        };
      }
      
      const result = await processPayment(reservationId, amount, method, paymentData);
      
      if (result.success) {
        alert("Paiement initié avec succès");
        document.body.removeChild(modalContainer);
        
        window.location.href = '/app-gestion-parking/public/payments';
      } else {
        errorElement.textContent = result.error || "Erreur lors du traitement du paiement";
      }
    } catch (error) {
      console.error("Erreur:", error);
      errorElement.textContent = "Une erreur est survenue lors du paiement";
    }
  });
  
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(modalContainer);
  });
  
  const paymentMethodInputs = document.querySelectorAll('input[name="payment_method"]');
  const paymentDetails = document.querySelectorAll('.payment-method-details');
  
  paymentMethodInputs.forEach(input => {
    input.addEventListener('change', () => {
      paymentDetails.forEach(detail => {
        detail.style.display = 'none';
      });
      
      const selectedMethod = document.querySelector('input[name="payment_method"]:checked').value;
      document.getElementById(`${selectedMethod}_details`).style.display = 'block';
    });
  });
  
  document.getElementById('cb_details').style.display = 'block';
}