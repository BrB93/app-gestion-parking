import { fetchJSON, postJSON } from "../core/fetchWrapper.js";
import { Payment } from "../models/payment.js";
import { renderPayments, renderPaymentForm } from "../views/paymentView.js";
import { getCurrentUser } from "./authController.js";

export async function loadPayments() {
  try {
      console.log("Chargement des paiements...");
      const response = await fetch("/app-gestion-parking/public/api/payments");
      
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseText = await response.text();
      let data;
      
      try {
          data = JSON.parse(responseText);
      } catch (parseError) {
          console.error("Erreur de parsing JSON:", parseError);
          console.error("Réponse brute:", responseText);
          throw new Error("La réponse du serveur n'est pas au format JSON valide");
      }
      
      console.log("Données de paiements reçues:", data);
      
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
          alert("Erreur: " + result.error);
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
      const currentUser = getCurrentUser();
      const isAdmin = currentUser && currentUser.role === 'admin';
      
      let confirmMessage = "Êtes-vous sûr de vouloir annuler ce paiement ?";
      if (isAdmin) {
        const paymentStatus = button.closest('.payment-card').querySelector('.status-completed');
        if (paymentStatus) {
          confirmMessage = "Êtes-vous sûr de vouloir rembourser ce paiement ?";
        }
      }
      
      if (confirm(confirmMessage)) {
        try {
          const result = await cancelPayment(paymentId);
          if (result.success) {
            alert(result.message);
            loadPayments();
            alert("Erreur: " + result.error);
          }
        } catch (error) {
          console.error("Erreur:", error);
          alert("Une erreur est survenue");
        }
      }
    });
  });
}

export function showPaymentForm(reservationId, amount) {
  const modalContainer = document.createElement('div');
  modalContainer.className = 'modal-container';
  modalContainer.id = 'payment-modal';
  
  if (typeof amount === 'string') {
    amount = parseFloat(amount);
  }
  
  if (isNaN(amount) || amount <= 0) {
    import('../controllers/reservationController.js').then(async module => {
      try {
        const reservation = await module.getReservation(reservationId);
        if (reservation) {
          import('./pricingController.js').then(async pricingModule => {
            const result = await pricingModule.calculatePrice(
              reservation.spot_id,
              reservation.start_time.toISOString(),
              reservation.end_time.toISOString()
            );
            if (!result.error) {
              amount = result.price;
            } else {
              amount = 5.00;
            }
            continueWithPayment();
          });
        }
      } catch (error) {
        console.error("Erreur lors du calcul du prix:", error);
        amount = 5.00;
        continueWithPayment();
      }
    });
  } else {
    continueWithPayment();
  }

  function continueWithPayment() {
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
          paymentData = {
            card_number: document.getElementById('card_number').value,
            card_expiry: document.getElementById('card_expiry').value,
            card_cvv: document.getElementById('card_cvv').value
          };
        } else if (method === 'paypal') {
          paymentData = {
            paypal_email: document.getElementById('paypal_email').value
          };
        }
        
        const result = await processPayment(reservationId, amount, method, paymentData);
        
        if (result.success) {
          document.body.removeChild(modalContainer);
          alert("Paiement effectué avec succès!");
          window.location.href = "/app-gestion-parking/public/reservations";
        } else {
          errorElement.textContent = result.error || "Une erreur est survenue lors du paiement";
        }
      } catch (error) {
        console.error("Erreur:", error);
        errorElement.textContent = "Une erreur est survenue lors du paiement";
      }
    });
    
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modalContainer);
      window.location.href = "/app-gestion-parking/public/reservations";
    });
    
    setupPaymentMethodToggle();
  }
  
  function setupPaymentMethodToggle() {
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
}